from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_videoclips, CompositeAudioClip
import librosa
import numpy as np
import soundfile as sf

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
        
        # 只检查与下一个片段的相似度
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
            clip = video.subclip(last_end, start)
            processed_segments.append(clip)
        
        # 处理当前片段
        if cut_type == 'silence' and end - start > 0.5:
            # 静音片段超过500ms只保留500ms
            clip = video.subclip(start, start + 0.5)
            processed_segments.append(clip)
        elif cut_type == 'silence':
            # 短静音片段保持原样
            clip = video.subclip(start, end)
            processed_segments.append(clip)
        # 重复片段直接跳过
        
        last_end = end
    
    # 添加最后一段
    if last_end < video.duration:
        clip = video.subclip(last_end, video.duration)
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