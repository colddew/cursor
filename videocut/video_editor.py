from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_videoclips, CompositeAudioClip, VideoClip, CompositeVideoClip
import librosa
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os
from vosk import Model, KaldiRecognizer
import json
import wave

# 尝试不同的字体路径
FONT_PATHS = [
    "/System/Library/Fonts/STSong.ttc",
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/Library/Fonts/STSong.ttc"
]

# 找到可用的字体
FONT_PATH = None
for path in FONT_PATHS:
    if os.path.exists(path):
        FONT_PATH = path
        break

if FONT_PATH is None:
    raise Exception("找不到可用的中文字体文件")

def create_text_clip(text, size, font_size=55, duration=None):
    """使用 PIL 创建文字图片"""
    # 创建透明背景
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    try:
        # 加载字体
        font = ImageFont.truetype(FONT_PATH, font_size)
    except Exception as e:
        print(f"加载字体失败: {e}")
        # 使用默认字体
        font = ImageFont.load_default()
    
    # 获取文字大小
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    text_width = right - left
    text_height = bottom - top
    
    # 计算居中位置
    x = (size[0] - text_width) // 2
    y = size[1] * 2 // 3  # 从下往上1/3处
    
    # 绘制文字
    draw.text((x, y), text, font=font, fill='white')
    
    return img

def add_subtitle(video_clip, text, font_size=55):
    """添加字幕到视频"""
    # 创建字幕图片
    text_img = create_text_clip(text, (video_clip.w, video_clip.h), font_size)
    
    # 将 PIL 图片转换为 numpy 数组，并只保留 RGB 通道
    text_array = np.array(text_img)
    alpha = text_array[:, :, 3:] / 255.0  # 保存 alpha 通道
    text_array_rgb = text_array[:, :, :3]  # 只保留 RGB 通道
    
    # 创建一个固定的字幕帧函数
    def make_frame(t):
        frame = video_clip.get_frame(t)
        # 使用 alpha 通道混合视频帧和字幕
        return frame * (1 - alpha) + text_array_rgb * alpha
    
    # 创建新的视频剪辑
    final_clip = VideoClip(make_frame, duration=video_clip.duration)
    final_clip.fps = video_clip.fps
    final_clip.audio = video_clip.audio  # 保留原始音频
    
    return final_clip

def detect_silence_segments(audio_path, threshold=0.02):
    # 加载音频
    y, sr = librosa.load(audio_path)
    
    # 计算音频能量
    energy = librosa.feature.rms(y=y)[0]
    
    # 找出静音片段
    silence_segments = []
    is_silence = False
    start_time = 0
    
    frame_duration = len(y) / sr / len(energy)
    
    for i, e in enumerate(energy):
        if not is_silence and e <= threshold:
            is_silence = True
            start_time = i * frame_duration
        elif is_silence and e > threshold:
            is_silence = False
            end_time = i * frame_duration
            silence_segments.append((start_time, end_time))
    
    return silence_segments

def detect_similar_segments(audio_path, threshold=0.85, min_duration=1.0, max_duration=10.0):
    print("开始检测重复语音片段...")
    y, sr = librosa.load(audio_path)
    
    # 使用 librosa 提取梅尔频谱特征
    mel_spec = librosa.feature.melspectrogram(y=y, sr=sr)
    mel_db = librosa.power_to_db(mel_spec, ref=np.max)
    
    # 检测语音片段
    intervals = librosa.effects.split(y, top_db=20)
    
    # 存储语音片段及其特征
    segments = []
    for start, end in intervals:
        duration = (end - start) / sr
        if min_duration <= duration <= max_duration:
            segment_mel = mel_db[:, start//512:(end//512)]
            segments.append({
                'start': start/sr,
                'end': end/sr,
                'features': segment_mel,
                'duration': duration
            })
    
    # 检测连续的相似片段组
    segments_to_remove = []
    i = 0
    while i < len(segments) - 1:
        # 查找连续的相似片段
        current_feat = segments[i]['features']
        similar_group = []
        
        # 检查与下一个片段的相似
        next_feat = segments[i + 1]['features']
        
        # 如果两个片段间隔小于2秒
        if segments[i + 1]['start'] - segments[i]['end'] < 2.0:
            # 计算相似度
            min_len = min(current_feat.shape[1], next_feat.shape[1])
            feat1_resized = librosa.util.fix_length(current_feat, size=min_len, axis=1)
            feat2_resized = librosa.util.fix_length(next_feat, size=min_len, axis=1)
            
            similarity = np.corrcoef(feat1_resized.flatten(), feat2_resized.flatten())[0,1]
            
            # 如果相似度高，移除第一个片段
            if similarity > threshold:
                segments_to_remove.append((segments[i]['start'], segments[i]['end']))
                i += 1
            else:
                i += 1
        else:
            i += 1
    
    return segments_to_remove

def get_speech_content(audio_path, start_time, end_time, sample_rate=16000):
    """获取指定时间段的语音内容"""
    try:
        # 指定模型路径，这里需要先下载模型并解压
        model_path = "vosk-model-cn-0.1"
        if not os.path.exists(model_path):
            print("请先下载中文语音模型！")
            print("下载地址：https://alphacephei.com/vosk/models/vosk-model-cn-0.1.zip")
            print("下载后解压到当前目录")
            return "..."
        
        # 加载语音识别模型
        model = Model(model_path)
        
        # 将音频转换为正确的格式
        os.system(f"ffmpeg -i {audio_path} -ar {sample_rate} -ac 1 -f wav temp_segment.wav")
        
        # 读取音频文件
        wf = wave.open("temp_segment.wav", "rb")
        
        # 创建识别器
        rec = KaldiRecognizer(model, sample_rate)
        
        # 读取音频数据
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            rec.AcceptWaveform(data)
        
        # 获取识别结果
        result = json.loads(rec.FinalResult())
        text = result.get('text', '')
        
        # 清理临时文件
        os.remove("temp_segment.wav")
        
        return text if text else "..."
        
    except Exception as e:
        print(f"语音识别错误: {str(e)}")
        return "..."

def process_video(video_path, output_path, background_music_path):
    print("开始处理视频...")
    video = VideoFileClip(video_path)
    
    temp_audio_path = "temp_audio.wav"
    print("提取音频...")
    video.audio.write_audiofile(temp_audio_path)
    
    print("检测静音片段...")
    silence_segments = detect_silence_segments(temp_audio_path)
    
    print("检测重复语音片段...")
    segments_to_remove = detect_similar_segments(temp_audio_path)
    
    # 处理视频片段
    processed_segments = []
    last_end = 0
    current_time = 0
    
    # 修改排序逻辑
    all_cuts = (
        [(start, end, 'remove') for start, end in segments_to_remove] +
        [(start, end, 'silence') for start, end in silence_segments]
    )
    all_cuts.sort(key=lambda x: x[0])
    
    print("处理视频片段...")
    for start, end, cut_type in all_cuts:
        # 添加上一个结束点到当前开始点的片段
        if start > last_end:
            current_time = last_end
            clip = video.subclip(last_end, start)
            # 获取这段视频的语音内容
            speech_text = get_speech_content(temp_audio_path, last_end, start)
            if not speech_text:  # 如果没有识别出内容
                speech_text = "..."
            clip = add_subtitle(clip, speech_text)
            processed_segments.append(clip)
        
        # 处理当前片段
        if cut_type == 'silence' and end - start > 0.5:
            current_time = start
            clip = video.subclip(start, start + 0.5)
            clip = add_subtitle(clip, "...")  # 静音片段显示省略号
            processed_segments.append(clip)
        elif cut_type == 'silence':
            current_time = start
            clip = video.subclip(start, end)
            clip = add_subtitle(clip, "...")  # 静音片段显示省略号
            processed_segments.append(clip)
        
        last_end = end
    
    # 添加最后一段
    if last_end < video.duration:
        current_time = last_end
        clip = video.subclip(last_end, video.duration)
        speech_text = get_speech_content(temp_audio_path, last_end, video.duration)
        if not speech_text:
            speech_text = "..."
        clip = add_subtitle(clip, speech_text)
        processed_segments.append(clip)
    
    print("合并片段...")
    final_video = concatenate_videoclips(processed_segments)
    
    print("添加背景音乐...")
    background_music = AudioFileClip(background_music_path)
    background_music = background_music.subclip(0, final_video.duration)
    background_music = background_music.volumex(0.3)
    
    final_audio = CompositeAudioClip([final_video.audio, background_music])
    final_video = final_video.set_audio(final_audio)
    
    print("保存视频...")
    final_video.write_videofile(output_path, codec='libx264', audio_codec='aac')
    
    video.close()
    final_video.close()
    background_music.close()
    print("处理完成！")

# 执行视频处理
video_path = '/Users/colddew/Downloads/test/2.mp4'
output_path = '/Users/colddew/Downloads/test/2-2.mp4'
background_music_path = '/Users/colddew/Downloads/test/1.m4a'

process_video(video_path, output_path, background_music_path) 