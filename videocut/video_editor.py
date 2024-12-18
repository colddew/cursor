from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_videoclips, CompositeAudioClip, VideoClip
import librosa
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont
import os
import whisper
import re

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

# 在文件开头添加全局模型变量
_whisper_model = None

def get_whisper_model():
    """获取或初始化 whisper 模型（单例模式）"""
    global _whisper_model
    if _whisper_model is None:
        print("加载语音识别模型...")
        _whisper_model = whisper.load_model("medium")
    return _whisper_model

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
    """检测静音片段"""
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
        print(f"\n处理时间段 {start_time:.2f}-{end_time:.2f}")
        
        # 使用 moviepy 处理音频
        audio = AudioFileClip(audio_path)
        
        # 调整音频片段的时间，前后各延长 0.2 秒以获取更完整的语音
        actual_start = max(0, start_time - 0.2)
        actual_end = min(audio.duration, end_time + 0.2)
        segment = audio.subclip(actual_start, actual_end)
        
        # 保存音频片段
        temp_wav = "temp_segment.wav"
        segment.write_audiofile(temp_wav, fps=sample_rate, nbytes=2, codec='pcm_s16le', verbose=False)
        
        # 获取模型实例
        model = get_whisper_model()
        
        # 优化识别参数
        result = model.transcribe(
            temp_wav,
            language="zh",
            task="transcribe",
            beam_size=10,        # 增加搜索宽度
            best_of=10,          # 增加候选数量
            temperature=0.2,     # 适当增加采样温度
            fp16=False,
            condition_on_previous_text=True,
            initial_prompt=(
                "这是一段中文口播视频。内容可能包含：产品介绍、教程讲解、"
                "新闻播报等。语言风格正式、清晰。请以准确、自然的方式转录。"
            ),
            word_timestamps=True,  # 启用词级时间戳
            suppress_tokens=[-1],  # 抑制特殊标记
            compression_ratio_threshold=2.4,  # 调整压缩比阈值
            no_speech_threshold=0.6,  # 调整无语音检测阈值
            logprob_threshold=-1.0    # 调整对数概率阈值
        )
        
        text = result["text"].strip()
        
        # 后处理文本
        text = post_process_text(text)
        
        print(f"识别结果: {text}")
        
        # 清理资源
        audio.close()
        segment.close()
        os.remove(temp_wav)
        
        return text if text else "..."
        
    except Exception as e:
        print(f"语音识别错误: {str(e)}")
        return "..."

def post_process_text(text):
    """对识别文本进行后处理"""
    if not text:
        return text
        
    # 移除多余的标点符号
    text = re.sub(r'[，。！？]+(?=[，。！？])', '', text)
    
    # 移除重复的词语
    text = re.sub(r'([，。！？\s])?([^，。！？\s]{1,4})\2+', r'\1\2', text)
    
    # 移除语气词和填充词
    filler_words = ['呃', '啊', '嗯', '那个', '就是说', '你知道']
    for word in filler_words:
        text = text.replace(word, '')
    
    # 修正常见错误
    corrections = {
        '的的': '的',
        '了了': '了',
        '吗吗': '吗',
        '呢呢': '呢',
        '把把': '把'
    }
    for wrong, right in corrections.items():
        text = text.replace(wrong, right)
    
    return text.strip()

def process_video(video_path, output_path, background_music_path):
    """处理视频：添加字幕、删除静音、添加背景音乐"""
    try:
        print("开始处理视频...")
        video = VideoFileClip(video_path)
        
        temp_audio_path = "temp_audio.wav"
        print("提取音频...")
        video.audio.write_audiofile(temp_audio_path, verbose=False)
        
        print("检测静音片段...")
        silence_segments = detect_silence_segments(temp_audio_path)
        
        print("检测重复语音片段...")
        segments_to_remove = detect_similar_segments(temp_audio_path)
        
        # 处理视频片段
        processed_segments = []
        last_end = 0
        
        # 合并并排序所有需要处理的片段
        all_cuts = (
            [(start, end, 'remove') for start, end in segments_to_remove] +
            [(start, end, 'silence') for start, end in silence_segments]
        )
        all_cuts.sort(key=lambda x: x[0])
        
        print("处理视频片段...")
        for start, end, cut_type in all_cuts:
            # 处理有语音的片段
            if start > last_end:
                clip = video.subclip(last_end, start)
                speech_text = get_speech_content(temp_audio_path, last_end, start)
                if speech_text and speech_text != "...":
                    clip = add_subtitle(clip, speech_text)
                processed_segments.append(clip)
            
            # 处理静音片段
            if cut_type == 'silence':
                clip_duration = 0.5 if end - start > 0.5 else end - start
                clip = video.subclip(start, start + clip_duration)
                processed_segments.append(clip)
            
            last_end = end
        
        # 处理最后一段
        if last_end < video.duration:
            clip = video.subclip(last_end, video.duration)
            speech_text = get_speech_content(temp_audio_path, last_end, video.duration)
            if speech_text and speech_text != "...":
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
        
        # 清理资源
        video.close()
        final_video.close()
        background_music.close()
        os.remove(temp_audio_path)
        
        print("处理完成！")
        
    except Exception as e:
        print(f"处理视频时出错: {str(e)}")
        raise

if __name__ == "__main__":
    # 视频路径配置
    video_path = '/Users/colddew/Downloads/test/2.mp4'
    output_path = '/Users/colddew/Downloads/test/2-2.mp4'
    background_music_path = '/Users/colddew/Downloads/test/1.m4a'
    
    # 处理视频
    process_video(video_path, output_path, background_music_path) 