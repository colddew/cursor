from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_videoclips, CompositeAudioClip, VideoClip
import librosa
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont
import os
import whisper
import re
from aip import AipSpeech
import tempfile

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

# 在文件开头添加百度 API 配置
BAIDU_APP_ID = '66168906'
BAIDU_API_KEY = '6TIGNZBytItnvQpR7U2w3xIlc'
BAIDU_SECRET_KEY = '64xc14BJIQogiaFCPfZYM2zb2vHrEBghN'

def get_whisper_model():
    """获取或初始化 whisper 模型（单例模式）"""
    global _whisper_model
    if _whisper_model is None:
        print("加载语音识别模型...")
        _whisper_model = whisper.load_model("medium")
    return _whisper_model

def create_text_clip(text, size, font_size=50, duration=None):
    """使用 PIL 创建文字图片"""
    # 创建透明背景
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 移除末尾的句号
    text = text.rstrip('。！？.!?')
    
    # 尝试加载字体
    font = None
    try:
        font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", font_size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/STSong.ttc", font_size)
        except:
            print("无法加载中文字体，使用默认字体")
            font = ImageFont.load_default()
    
    # 获取文字大小并调整字体大小以适应屏幕宽度
    while True:
        left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
        text_width = right - left
        text_height = bottom - top
        
        # 如果文字宽度超过屏幕宽度的90%，减小字体大小
        if text_width > size[0] * 0.9:
            font_size -= 5
            try:
                font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", font_size)
            except:
                try:
                    font = ImageFont.truetype("/System/Library/Fonts/STSong.ttc", font_size)
                except:
                    font = ImageFont.load_default()
        else:
            break
        
        # 防止字体太小
        if font_size < 20:
            break
    
    # 计算背景位置
    vertical_padding = 30  # 背景上下内边距
    y = size[1] * 4.5 // 5  # 从下往上1/5处
    bg_top = y - vertical_padding
    bg_bottom = y + text_height + vertical_padding
    
    # 计算文字在背景内的垂直居中位置
    bg_height = bg_bottom - bg_top  # 背景高度
    text_y = bg_top + (bg_height - text_height) // 2  # 文字垂直居中
    
    # 计算文字水平居中位置
    x = (size[0] - text_width) // 2
    
    # 绘制矩形背景
    overlay = Image.new('RGBA', size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle(
        [0, bg_top, size[0], bg_bottom],  # 左右顶满屏幕
        fill=(0, 0, 0, 160)  # 黑色半透明背景
    )
    img = Image.alpha_composite(img, overlay)
    
    # 重新获取 draw 对象
    draw = ImageDraw.Draw(img)
    
    # 绘制文字 - 使用亮黄色
    # 通过多次绘制实现加粗效果
    yellow_color = '#FFFF00'  # 亮黄色
    offsets = [(0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)]  # 加粗偏移量
    for offset_x, offset_y in offsets:
        draw.text((x + offset_x, text_y + offset_y), text, font=font, fill=yellow_color)
    
    return img

def add_subtitle(video_clip, text, font_size=50):
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

def detect_similar_segments(audio_path, threshold=0.75, min_duration=0.3, max_duration=10.0):
    """检测重复或说错的语音片段"""
    print("开始检测重复语音片段...")
    y, sr = librosa.load(audio_path)
    
    # 使用 librosa 提取梅尔频谱特征
    mel_spec = librosa.feature.melspectrogram(
        y=y, 
        sr=sr,
        n_mels=128,
        hop_length=512,
        win_length=2048,
        fmax=8000
    )
    mel_db = librosa.power_to_db(mel_spec, ref=np.max)
    
    # 检测语音片段，降低阈值以捕获更多片段
    intervals = librosa.effects.split(y, top_db=15)
    
    # 存储语音片段及其特征
    segments = []
    for start, end in intervals:
        duration = (end - start) / sr
        if min_duration <= duration <= max_duration:
            segment_mel = mel_db[:, start//512:(end//512)]
            # 添加能量特征
            energy = librosa.feature.rms(y=y[start:end])[0]
            segments.append({
                'start': start/sr,
                'end': end/sr,
                'features': segment_mel,
                'energy': np.mean(energy),
                'duration': duration
            })
    
    # 检测需要移除的片段
    segments_to_remove = []
    i = 0
    while i < len(segments) - 1:
        current_feat = segments[i]['features']
        current_energy = segments[i]['energy']
        j = i + 1
        similar_group = [(segments[i]['start'], segments[i]['end'])]
        
        # 查找连续的相似片段
        while j < len(segments):
            # 如果两个片段间隔超过2秒，停止查找
            if segments[j]['start'] - segments[j-1]['end'] > 2.0:
                break
                
            next_feat = segments[j]['features']
            next_energy = segments[j]['energy']
            
            # 计算相似度
            min_len = min(current_feat.shape[1], next_feat.shape[1])
            feat1_resized = librosa.util.fix_length(current_feat, size=min_len, axis=1)
            feat2_resized = librosa.util.fix_length(next_feat, size=min_len, axis=1)
            
            # 计算频谱相似度
            similarity = np.corrcoef(feat1_resized.flatten(), feat2_resized.flatten())[0,1]
            
            # 计算能量差异
            energy_ratio = min(current_energy, next_energy) / max(current_energy, next_energy)
            
            # 综合考虑频谱相似度和能量差异
            if similarity > threshold and energy_ratio > 0.7:
                similar_group.append((segments[j]['start'], segments[j]['end']))
                j += 1
            else:
                break
        
        # 如果找到相似组
        if len(similar_group) > 1:
            # 保留最后一个片段，移除其他片段
            segments_to_remove.extend(similar_group[:-1])
            i = j  # 跳过已处理的片段
        else:
            i += 1
    
    # 合并临近的片段
    if segments_to_remove:
        merged_segments = []
        current_start, current_end = segments_to_remove[0]
        
        for start, end in segments_to_remove[1:]:
            if start - current_end <= 0.3:  # 如果间隔小于0.3秒
                current_end = end
            else:
                merged_segments.append((current_start, current_end))
                current_start, current_end = start, end
        
        merged_segments.append((current_start, current_end))
        segments_to_remove = merged_segments
    
    return segments_to_remove

def get_speech_content(audio_path, start_time, end_time, sample_rate=16000):
    """获取指定时间段的语音内容"""
    try:
        print(f"\n处理时间段 {start_time:.2f}-{end_time:.2f}")
        
        # 使用 moviepy 处理音频
        audio = AudioFileClip(audio_path)
        
        # 延长音频片段以获取更完整的语音上下文
        actual_start = max(0, start_time - 0.2)
        actual_end = min(audio.duration, end_time + 0.2)
        segment = audio.subclip(actual_start, actual_end)
        
        # 保存音频片段，确保格式正确
        temp_wav = "temp_segment.wav"
        segment.write_audiofile(
            temp_wav,
            fps=16000,           # 必须是16k采样率
            nbytes=2,            # 16位采样
            codec='pcm_s16le',   # PCM 16位编码
            ffmpeg_params=[      # 确保单声道
                "-ac", "1",
                "-ar", "16000"
            ],
            verbose=False
        )
        
        # 初始化 AipSpeech 客户端
        client = AipSpeech(BAIDU_APP_ID, BAIDU_API_KEY, BAIDU_SECRET_KEY)
        
        # 读取音频文件
        with open(temp_wav, 'rb') as fp:
            audio_data = fp.read()
        
        # 调用百度语音识别 API，使用优化的参数
        result = client.asr(
            audio_data,
            'pcm',              # 使用 PCM 格式
            16000,              # 采样率必须是16k
            {
                'dev_pid': 1537,    # 普通话(支持简单的英文识别)
                'format': 'pcm',     # 音频格式
                'rate': 16000,       # 采样率
                'channel': 1,        # 单声道
                'cuid': 'python',    # 用户标识
                'speech_quality': 4, # 提高语音清晰度到最高
                'enable_itn': True,  # 开启语音规整
                'enable_punctuation': True,  # 开启标点优化
            }
        )
        
        # 处理识别结果
        if result['err_no'] == 0:
            text = result['result'][0]
            text = post_process_text(text)
            print(f"识别结果: {text}")
        else:
            error_codes = {
                3300: "输入参数不正确",
                3301: "音频质量过差",
                3302: "鉴权失败",
                3303: "语音服务器后端问题",
                3304: "用户的请求QPS超限",
                3305: "用户的日pv（日请求量）超限",
                3307: "语音时长超出限制",
                3308: "音频过大",
                3309: "音频数据问题",
                3310: "输入的音频文件过大",
                3311: "采样率rate参数不在选项里",
                3312: "音频格式format参数不在选项里",
            }
            error_msg = error_codes.get(result['err_no'], result['err_msg'])
            print(f"识别失败: {error_msg} (错误码: {result['err_no']})")
            text = "..."
        
        # 清理资源
        audio.close()
        segment.close()
        os.remove(temp_wav)
        
        return text
        
    except Exception as e:
        print(f"语音识别错误: {str(e)}")
        return "..."

def post_process_text(text):
    """对识别文本进行后处理"""
    if not text:
        return text
    
    # 特定词语的修正
    specific_corrections = {
        '酒吧4.5': '984.5',
        '小酒': '小985',
        '双线': '计算机',
        '哈高层': '哈工程',
        '系数代理': '悉数在列',
        '下造成': '校招',
        '搞上': '考上',
        '星空科': '新工科',
        '现在交通': '西南交通',
        '985工程大': '985工程大学'    }
    
    for wrong, right in specific_corrections.items():
        text = text.replace(wrong, right)
    
    # 移除音频开头和结尾的标点符号
    text = text.strip('，。！？,.!?')
    
    # 标准化标点符号
    text = text.replace('，', '，').replace('。', '。').replace('！', '！').replace('？', '？')
    
    # 修正常见的错别字和词语
    corrections = {
        '的的': '的',
        '了了': '了',
        '吗吗': '吗',
        '呢呢': '呢',
        '把把': '把',
        '和和': '和',
        '都都': '都',
        '很很': '很',
        '就就': '就',
        '在在': '在',
        '地地': '地',
        '得得': '得',
        '着着': '着',
        '过过': '过',
        '去去': '去',
        '来来': '来',
        '做做': '做',
        '是是': '是',
        '有有': '有',
        '会会': '会',
        '那个': '',
        '这个': '',
        '所以': '',
        '然后': '',
        '就是': '',
        '其实': '',
        '可能': '',
        '应该': '',
        '好像': '',
        '大概': '',
        '基本上': '',
        '一般来说': '',
        '这样子': '',
        '那样子': '',
        '啊': '',
        '嗯': '',
        '呃': '',
        '嘛': '',
        '呗': '',
        '哦': '',
        '诶': '',
        '哎': '',
        '唉': '',
        '额': '',
        '那么': '',
        '这么': '',
        '什么': '',
        '怎么': '',
        '为什么': '',
        '怎样': '',
        '如何': '',
        '到底': '',
        '究竟': '',
        '一直': '',
        '总是': '',
        '一般': '',
        '通常': '',
        '往往': '',
        '经常': '',
        '有时': '',
        '偶尔': '',
        '几乎': '',
        '差不多': '',
        '大约': '',
        '大致': '',
        '或者': '',
        '要么': '',
        '还是': '',
        '不过': '',
        '反而': '',
        '反正': '',
        '总之': '',
        '总的来说': '',
        '简单来说': '',
        '说白了': '',
        '说实话': '',
        '老实说': '',
        '说真的': '',
    }
    
    for wrong, right in corrections.items():
        text = text.replace(wrong, right)
    
    return text.strip()

def process_video(video_path, output_path, background_music_path):
    """处理视频：添加字幕、删除静音、添加背景音乐"""
    temp_audio_path = "temp_audio.wav"
    
    try:
        print("开始处理视频...")
        video = VideoFileClip(video_path)
        
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
    
    finally:
        # 清理临时文件
        try:
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
                print("已清理临时文件")
        except Exception as e:
            print(f"清理临时文件失败: {str(e)}")

if __name__ == "__main__":
    try:
        # 视频路径配置
        video_path = '/Users/colddew/Downloads/test/2.mp4'
        output_path = '/Users/colddew/Downloads/test/2-2.mp4'
        background_music_path = '/Users/colddew/Downloads/test/1.m4a'
        
        # 处理视频
        process_video(video_path, output_path, background_music_path)
        
    except Exception as e:
        print(f"程序执行出错: {str(e)}")
    
    finally:
        # 确保清理所有临时文件
        temp_files = ["temp_audio.wav", "temp_segment.wav"]
        for temp_file in temp_files:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                    print(f"已清理临时文件: {temp_file}")
            except Exception as e:
                print(f"清理临时文件 {temp_file} 失败: {str(e)}") 