import pygame
import random
import sys
import array
import platform
import math

# ============ 音效系统 ============
class SoundManager:
    """音效管理器 - 生成合成音效（啵啵/风铃/魔法布林布林）"""
    def __init__(self):
        self.enabled = True
        try:
            pygame.mixer.init(frequency=44100, size=-16, channels=1, buffer=512)
            self.sounds = {}
            self._generate_sounds()
        except:
            self.enabled = False
            print("音效系统初始化失败")

    def _generate_boop(self, freq, duration, volume=0.25):
        """生成啵啵声 - 快速衰减的正弦波"""
        if not self.enabled:
            return None
        try:
            sample_rate = 44100
            n_samples = int(sample_rate * duration)
            buffer = array.array('h', [0] * n_samples)

            for i in range(n_samples):
                t = float(i) / sample_rate
                # 快速指数衰减（啵的效果）
                decay = math.exp(-t * 25)
                # 简单正弦波
                wave = math.sin(2 * math.pi * freq * t)
                # 快速包络
                envelope = min(1.0, t * 100)  # 快速起音
                value = int(32767 * volume * decay * envelope * wave)
                buffer[i] = value

            return pygame.mixer.Sound(buffer)
        except:
            return None

    def _generate_wind_chime(self, base_freq, duration, volume=0.35):
        """生成空灵风铃 - 多频率泛音 + 长尾"""
        if not self.enabled:
            return None
        try:
            sample_rate = 44100
            n_samples = int(sample_rate * duration)
            buffer = array.array('h', [0] * n_samples)

            # 风铃频率组（五声音阶泛音）
            chime_freqs = [
                base_freq,              # 基频
                base_freq * 2.4,        # 泛音1
                base_freq * 3.2,        # 泛音2
                base_freq * 4.5,        # 泛音3
                base_freq * 6.0,        # 泛音4（高频闪烁）
            ]

            for i in range(n_samples):
                t = float(i) / sample_rate
                wave = 0

                # 叠加多个频率
                for idx, freq in enumerate(chime_freqs):
                    amp = 0.4 / (idx + 1)  # 高频衰减
                    # 长尾衰减（风铃的余音）
                    decay = math.exp(-t * (3 + idx))
                    wave += amp * math.sin(2 * math.pi * freq * t) * decay

                # 整体包络（柔和起音）
                envelope = min(1.0, t * 20) * math.exp(-t * 2)
                value = int(32767 * volume * envelope * wave)
                buffer[i] = value

            return pygame.mixer.Sound(buffer)
        except:
            return None

    def _generate_magic_shimmer(self, duration, volume=0.3):
        """生成魔法布林布林 - 频率扫频 + 闪烁和声"""
        if not self.enabled:
            return None
        try:
            sample_rate = 44100
            n_samples = int(sample_rate * duration)
            buffer = array.array('h', [0] * n_samples)

            # 魔法音效使用多个频率同时扫频
            base_freqs = [523, 659, 784, 1047, 1319]  # C大调和弦扩展

            for i in range(n_samples):
                t = float(i) / sample_rate
                wave = 0

                # 每个频率独立扫频
                for idx, base_f in enumerate(base_freqs):
                    # 频率上升然后下降（布林效果）
                    if t < duration * 0.4:
                        freq = base_f + t * 800  # 上升
                    else:
                        freq = base_f + (duration * 0.4) * 800 - (t - duration * 0.4) * 500  # 下降

                    # 闪烁效果（高频调制）
                    shimmer = 1 + 0.3 * math.sin(2 * math.pi * 15 * t)
                    amp = 0.3 / (idx + 1)
                    decay = math.exp(-t * 1.5)

                    wave += amp * math.sin(2 * math.pi * freq * t) * shimmer * decay

                # 和声包络
                envelope = math.sin(math.pi * t / duration) ** 0.5
                value = int(32767 * volume * envelope * wave)
                buffer[i] = value

            return pygame.mixer.Sound(buffer)
        except:
            return None

    def _generate_sounds(self):
        """生成游戏音效"""
        if not self.enabled:
            return

        try:
            # 旋转音效 - 啵啵俏皮声
            rotate_sound = self._generate_boop(932, 0.06, 0.2)  # A#5
            if rotate_sound:
                self.sounds['rotate'] = rotate_sound

            # 消行音效 - 空灵风铃（C6高音）
            clear_sound = self._generate_wind_chime(1047, 0.8, 0.35)
            if clear_sound:
                self.sounds['clear'] = clear_sound

            # 多连消音效 - 魔法布林布林拖长音
            multi_sound = self._generate_magic_shimmer(1.2, 0.35)
            if multi_sound:
                self.sounds['multi_clear'] = multi_sound

            # 游戏结束音效 - 下降悲伤音
            sample_rate = 44100
            gameover_samples = int(sample_rate * 1.0)
            gameover_buffer = array.array('h', [0] * gameover_samples)
            for i in range(gameover_samples):
                t = float(i) / sample_rate
                freq = max(100, 600 - t * 400)
                wave = math.sin(2 * math.pi * freq * t)
                decay = math.exp(-t * 1.5)
                value = int(32767 * 0.3 * decay * wave)
                gameover_buffer[i] = value
            self.sounds['gameover'] = pygame.mixer.Sound(gameover_buffer)

        except Exception as e:
            print(f"生成音效失败: {e}")
            self.enabled = False

    def play(self, sound_name):
        """播放音效"""
        if self.enabled and sound_name in self.sounds:
            try:
                self.sounds[sound_name].play()
            except:
                pass

# ============ 科技感配色方案 ============
# 霓虹色系 + 深色背景
COLORS = {
    'bg': (8, 8, 16),           # 深空蓝背景
    'bg_dark': (5, 5, 10),      # 更深的背景
    'grid': (30, 40, 60),       # 网格线
    'border': (0, 200, 255),    # 边框发光色
    'border_glow': (0, 100, 150), # 边框光晕
    'text': (200, 220, 255),    # 文字颜色
    'text_dim': (100, 120, 150), # 暗淡文字
    'highlight': (255, 255, 100), # 高亮色

    # 方块颜色 - 霓虹风格
    'cyan': (0, 255, 255),      # I - 青色
    'blue': (50, 100, 255),     # J - 蓝色
    'orange': (255, 150, 50),   # L - 橙色
    'yellow': (255, 255, 100),  # O - 黄色
    'green': (100, 255, 100),   # S - 绿色
    'purple': (200, 100, 255),  # T - 紫色
    'red': (255, 80, 80),       # Z - 红色
}

BLOCK_COLORS = [
    (0, 0, 0),
    COLORS['cyan'],
    COLORS['blue'],
    COLORS['orange'],
    COLORS['yellow'],
    COLORS['green'],
    COLORS['purple'],
    COLORS['red'],
]

# 定义方块形状
SHAPES = [
    [[1, 5, 9, 13], [4, 5, 6, 7]],  # I
    [[1, 2, 5, 9], [0, 4, 5, 6], [1, 5, 9, 8], [4, 5, 6, 10]],  # J
    [[1, 2, 6, 10], [5, 6, 7, 9], [2, 6, 10, 14], [3, 5, 6, 7]],  # L
    [[1, 2, 5, 6]],  # O
    [[6, 7, 9, 10], [1, 5, 6, 10]],  # S
    [[1, 4, 5, 6], [1, 4, 5, 9], [4, 5, 6, 9], [1, 5, 6, 9]],  # T
    [[4, 5, 9, 10], [2, 6, 5, 9]]  # Z
]

class Particle:
    """消行时的粒子效果"""
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.color = color
        self.vx = random.uniform(-3, 3)
        self.vy = random.uniform(-5, -1)
        self.life = 1.0
        self.decay = random.uniform(0.02, 0.05)

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += 0.2  # 重力
        self.life -= self.decay
        return self.life > 0

    def draw(self, surface, zoom):
        if self.life > 0:
            alpha = int(self.life * 255)
            size = int(zoom * 0.3 * self.life)
            color = (*self.color[:3], alpha)
            s = pygame.Surface((size * 2, size * 2), pygame.SRCALPHA)
            pygame.draw.circle(s, color, (size, size), size)
            surface.blit(s, (int(self.x), int(self.y)))

class Tetris:
    def __init__(self, height, width, sound_manager):
        self.height = height
        self.width = width
        self.field = []
        self.score = 0
        self.lines = 0
        self.level = 1
        self.state = "start"  # start, playing, paused, gameover
        self.figure = None
        self.next_figure = None
        self.particles = []
        self.sound = sound_manager

        # 游戏区域配置
        self.zoom = 28
        self.margin = 30
        self.panel_width = 200

        # 计算游戏区域位置（居中）
        self.board_width = self.width * self.zoom
        self.board_height = self.height * self.zoom

        self.clear_field()

    def clear_field(self):
        self.field = []
        for i in range(self.height):
            new_line = []
            for j in range(self.width):
                new_line.append(0)
            self.field.append(new_line)

    def new_figure(self):
        if self.next_figure is None:
            self.figure = Figure(3, 0)
        else:
            self.figure = self.next_figure
            self.figure.x = 3
            self.figure.y = 0
        self.next_figure = Figure(0, 0)

    def get_drop_speed(self):
        """根据等级计算下落速度"""
        return max(5, 50 - self.level * 5)

    def intersects(self):
        for i in range(4):
            for j in range(4):
                if i * 4 + j in self.figure.image():
                    if (i + self.figure.y < 0 or
                        i + self.figure.y > self.height - 1 or
                        j + self.figure.x > self.width - 1 or
                        j + self.figure.x < 0):
                        return True
                    if i + self.figure.y >= 0 and self.field[i + self.figure.y][j + self.figure.x] > 0:
                        return True
        return False

    def freeze(self):
        for i in range(4):
            for j in range(4):
                if i * 4 + j in self.figure.image():
                    self.field[i + self.figure.y][j + self.figure.x] = self.figure.color

        lines_cleared = self.break_lines()
        self.new_figure()

        if self.intersects():
            self.state = "gameover"
            self.sound.play('gameover')

        return lines_cleared

    def break_lines(self):
        lines = 0
        cleared_rows = []

        for i in range(self.height):
            zeros = 0
            for j in range(self.width):
                if self.field[i][j] == 0:
                    zeros += 1
            if zeros == 0:
                lines += 1
                cleared_rows.append(i)

        # 创建粒子效果
        for row in cleared_rows:
            for j in range(self.width):
                color = BLOCK_COLORS[self.field[row][j]]
                px = self.margin + j * self.zoom + self.zoom // 2
                py = self.margin + row * self.zoom + self.zoom // 2
                for _ in range(8):
                    self.particles.append(Particle(px, py, color))

        # 移除满行
        for i in sorted(cleared_rows, reverse=True):
            for i1 in range(i, 0, -1):
                for j in range(self.width):
                    self.field[i1][j] = self.field[i1-1][j]
            for j in range(self.width):
                self.field[0][j] = 0

        # 计分和升级
        if lines > 0:
            self.lines += lines
            self.score += lines * lines * 100 * self.level
            self.level = self.lines // 10 + 1

            # 播放消行音效
            if lines >= 4:
                self.sound.play('multi_clear')
            elif lines > 1:
                self.sound.play('multi_clear')
            else:
                self.sound.play('clear')

        return lines

    def go_side(self, dx):
        old_x = self.figure.x
        self.figure.x += dx
        if self.intersects():
            self.figure.x = old_x

    def go_down(self):
        self.figure.y += 1
        if self.intersects():
            self.figure.y -= 1
            self.freeze()

    def rotate(self):
        old_rotation = self.figure.rotation
        self.figure.rotate()
        if self.intersects():
            self.figure.rotation = old_rotation
        else:
            self.sound.play('rotate')

    def update_particles(self):
        self.particles = [p for p in self.particles if p.update()]

class Figure:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.type = random.randint(0, len(SHAPES) - 1)
        self.color = random.randint(1, len(BLOCK_COLORS) - 1)
        self.rotation = 0

    def image(self):
        return SHAPES[self.type][self.rotation]

    def rotate(self):
        self.rotation = (self.rotation + 1) % len(SHAPES[self.type])

def get_chinese_font(size, bold=False):
    """获取支持中文的字体"""
    system = platform.system()

    # 中文字体列表（按优先级）
    chinese_fonts = []

    if system == "Darwin":  # macOS
        chinese_fonts = [
            'pingfangsc',
            'hiraginosansgb',
            'stheiti',
            'stheiti',
            'heiti',
            'songti',
            'kai',
            'Arial Unicode MS',
            'sans-serif'
        ]
    elif system == "Windows":
        chinese_fonts = [
            'microsoftyahei',
            'simhei',
            'simsun',
            'kaiti',
            'fangsong',
            'sans-serif'
        ]
    else:  # Linux
        chinese_fonts = [
            'wenquanyimicrohei',
            'wenquanyizenhei',
            'notosanscjk',
            'droidfontsfallback',
            'sans-serif'
        ]

    # 获取系统所有可用字体
    available_fonts = pygame.font.get_fonts()

    # 尝试匹配中文字体
    for font_name in chinese_fonts:
        # 检查是否在可用字体中（不区分大小写）
        for available in available_fonts:
            if font_name.lower() in available.lower() or available.lower() in font_name.lower():
                try:
                    return pygame.font.SysFont(available, size, bold=bold)
                except:
                    continue

    # 直接尝试使用字体名称
    for font_name in chinese_fonts:
        try:
            font = pygame.font.SysFont(font_name, size, bold=bold)
            # 测试中文渲染（检查是否有错误）
            if font.get_height() > 0:
                return font
        except:
            continue

    # 最后尝试使用系统默认
    try:
        font = pygame.font.SysFont('sans-serif', size, bold=bold)
        if font.get_height() > 0:
            return font
    except:
        pass

    # 回退到默认字体（可能无法显示中文）
    return pygame.font.Font(None, size)

def draw_glow_rect(surface, color, rect, width=0, glow_radius=10):
    """绘制带发光效果的矩形"""
    # 绘制光晕
    if glow_radius > 0:
        glow_surf = pygame.Surface((rect[2] + glow_radius * 2, rect[3] + glow_radius * 2), pygame.SRCALPHA)
        glow_color = (*color[:3], 50)
        pygame.draw.rect(glow_surf, glow_color, (glow_radius, glow_radius, rect[2], rect[3]), width + 4)
        pygame.draw.rect(glow_surf, (*color[:3], 30), (glow_radius - 2, glow_radius - 2, rect[2] + 4, rect[3] + 4), width + 8)
        surface.blit(glow_surf, (rect[0] - glow_radius, rect[1] - glow_radius))

    # 绘制主矩形
    pygame.draw.rect(surface, color, rect, width)

def draw_block(screen, x, y, zoom, color, is_ghost=False):
    """绘制单个方块（带3D效果）"""
    if is_ghost:
        # 幽灵方块（预览落下位置）
        s = pygame.Surface((zoom - 2, zoom - 2), pygame.SRCALPHA)
        pygame.draw.rect(s, (*color[:3], 80), (0, 0, zoom - 2, zoom - 2), 2)
        screen.blit(s, (x + 1, y + 1))
    else:
        # 主体
        main_rect = [x + 1, y + 1, zoom - 2, zoom - 2]
        pygame.draw.rect(screen, color, main_rect)

        # 高光效果（3D立体感）
        highlight = [(min(255, color[0] + 60), min(255, color[1] + 60), min(255, color[2] + 60))]
        pygame.draw.line(screen, highlight[0], (x + 2, y + 2), (x + zoom - 3, y + 2), 2)
        pygame.draw.line(screen, highlight[0], (x + 2, y + 2), (x + 2, y + zoom - 3), 2)

        # 阴影效果
        shadow = [(max(0, color[0] - 60), max(0, color[1] - 60), max(0, color[2] - 60))]
        pygame.draw.line(screen, shadow[0], (x + zoom - 3, y + 2), (x + zoom - 3, y + zoom - 3), 2)
        pygame.draw.line(screen, shadow[0], (x + 2, y + zoom - 3), (x + zoom - 3, y + zoom - 3), 2)

def draw_game(screen, game, fonts):
    """绘制游戏画面"""
    screen.fill(COLORS['bg'])

    # ============ 绘制游戏区域背景 ============
    board_x = game.margin
    board_y = game.margin

    # 背景渐变效果
    bg_rect = [board_x, board_y, game.board_width, game.board_height]
    pygame.draw.rect(screen, COLORS['bg_dark'], bg_rect)

    # 绘制网格线
    for i in range(game.height + 1):
        y = board_y + i * game.zoom
        pygame.draw.line(screen, COLORS['grid'], (board_x, y), (board_x + game.board_width, y), 1)
    for j in range(game.width + 1):
        x = board_x + j * game.zoom
        pygame.draw.line(screen, COLORS['grid'], (x, board_y), (x, board_y + game.board_height), 1)

    # 绘制发光边框
    draw_glow_rect(screen, COLORS['border'],
                   [board_x - 3, board_y - 3, game.board_width + 6, game.board_height + 6], 3, 15)

    # ============ 绘制已固定的方块 ============
    for i in range(game.height):
        for j in range(game.width):
            if game.field[i][j] > 0:
                x = board_x + j * game.zoom
                y = board_y + i * game.zoom
                draw_block(screen, x, y, game.zoom, BLOCK_COLORS[game.field[i][j]])

    # ============ 绘制当前方块 ============
    if game.figure is not None and game.state in ["start", "playing"]:
        # 绘制幽灵方块（预览）
        ghost_y = game.figure.y
        while True:
            ghost_y += 1
            temp_y = game.figure.y
            game.figure.y = ghost_y
            if game.intersects():
                ghost_y -= 1
                game.figure.y = temp_y
                break
            game.figure.y = temp_y

        for i in range(4):
            for j in range(4):
                p = i * 4 + j
                if p in game.figure.image():
                    x = board_x + game.zoom * (j + game.figure.x)
                    y = board_y + game.zoom * (i + ghost_y)
                    if 0 <= x < board_x + game.board_width and 0 <= y < board_y + game.board_height:
                        draw_block(screen, x, y, game.zoom, BLOCK_COLORS[game.figure.color], is_ghost=True)

        # 绘制实际方块
        for i in range(4):
            for j in range(4):
                p = i * 4 + j
                if p in game.figure.image():
                    x = board_x + game.zoom * (j + game.figure.x)
                    y = board_y + game.zoom * (i + game.figure.y)
                    draw_block(screen, x, y, game.zoom, BLOCK_COLORS[game.figure.color])

    # ============ 绘制粒子效果 ============
    for p in game.particles:
        p.draw(screen, game.zoom)

    # ============ 绘制右侧信息面板 ============
    panel_x = board_x + game.board_width + 40
    panel_y = board_y

    # 分数
    draw_text_panel(screen, fonts, panel_x, panel_y, "分数", f"{game.score:,}")
    panel_y += 100

    # 等级
    draw_text_panel(screen, fonts, panel_x, panel_y, "等级", f"{game.level}")
    panel_y += 100

    # 行数
    draw_text_panel(screen, fonts, panel_x, panel_y, "行数", f"{game.lines}")
    panel_y += 100

    # 下一个方块
    next_label = fonts['medium'].render("下一个", True, COLORS['text'])
    screen.blit(next_label, (panel_x, panel_y))
    panel_y += 35

    if game.next_figure:
        next_box_x = panel_x + 10
        next_box_y = panel_y
        next_box_size = 100
        draw_glow_rect(screen, COLORS['border_glow'],
                      [next_box_x, next_box_y, next_box_size, next_box_size], 2, 8)

        center_offset_x = (next_box_size - 4 * game.zoom) // 2
        center_offset_y = (next_box_size - 4 * game.zoom) // 2

        for i in range(4):
            for j in range(4):
                p = i * 4 + j
                if p in game.next_figure.image():
                    x = next_box_x + center_offset_x + j * game.zoom
                    y = next_box_y + center_offset_y + i * game.zoom
                    draw_block(screen, x, y, game.zoom, BLOCK_COLORS[game.next_figure.color])

    # ============ 绘制控制说明 ============
    controls = [
        ("← →", "移动"),
        ("↑", "旋转"),
        ("↓", "加速"),
        ("P / ESC", "暂停"),
        ("R / 空格", "重新开始")
    ]

    help_y = panel_y + 130
    for key, action in controls:
        text = fonts['small'].render(f"{key}: {action}", True, COLORS['text_dim'])
        screen.blit(text, (panel_x, help_y))
        help_y += 22

    # ============ 绘制暂停/游戏结束覆盖层 ============
    if game.state == "paused":
        draw_overlay(screen, fonts, "暂停", "按 P 或 ESC 继续")
    elif game.state == "gameover":
        draw_overlay(screen, fonts, "游戏结束", "按 R 或 空格键 重新开始")

def draw_text_panel(screen, fonts, x, y, label, value):
    """绘制信息面板"""
    # 标签
    label_surf = fonts['small'].render(label, True, COLORS['text_dim'])
    screen.blit(label_surf, (x, y))

    # 发光背景
    value_surf = fonts['large'].render(value, True, COLORS['text'])

    # 绘制光晕
    glow = fonts['large'].render(value, True, (*COLORS['border'][:3], 100))
    screen.blit(glow, (x + 1, y + 20))
    screen.blit(glow, (x - 1, y + 20))
    screen.blit(glow, (x, y + 19))
    screen.blit(glow, (x, y + 21))

    screen.blit(value_surf, (x, y + 20))

def draw_overlay(screen, fonts, title, subtitle):
    """绘制覆盖层（暂停/游戏结束）"""
    overlay = pygame.Surface((screen.get_width(), screen.get_height()), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 180))
    screen.blit(overlay, (0, 0))

    title_surf = fonts['huge'].render(title, True, COLORS['text'])
    title_rect = title_surf.get_rect(center=(screen.get_width() // 2, screen.get_height() // 2 - 30))
    screen.blit(title_surf, title_rect)

    sub_surf = fonts['medium'].render(subtitle, True, COLORS['highlight'])
    sub_rect = sub_surf.get_rect(center=(screen.get_width() // 2, screen.get_height() // 2 + 30))
    screen.blit(sub_surf, sub_rect)

def main():
    pygame.init()

    # 初始化音效系统
    sound_manager = SoundManager()

    # 计算窗口大小
    zoom = 28
    board_width = 10 * zoom
    board_height = 20 * zoom
    margin = 30
    panel_width = 220

    window_width = margin * 2 + board_width + panel_width
    window_height = margin * 2 + board_height

    screen = pygame.display.set_mode((window_width, window_height))
    pygame.display.set_caption("⚡ TETRIS - Cyber Edition ⚡")

    # 字体 - 使用中文字体
    fonts = {
        'small': get_chinese_font(16, bold=True),
        'medium': get_chinese_font(24, bold=True),
        'large': get_chinese_font(32, bold=True),
        'huge': get_chinese_font(64, bold=True)
    }

    clock = pygame.time.Clock()
    fps = 60

    game = Tetris(20, 10, sound_manager)
    game.new_figure()
    game.state = "playing"

    counter = 0

    # 按键状态跟踪（提高响应性）
    keys = {
        pygame.K_LEFT: 0,
        pygame.K_RIGHT: 0,
        pygame.K_DOWN: 0,
        pygame.K_UP: 0
    }

    # 按键响应设置（60 FPS下）
    key_initial_delay = 10  # 首次移动前的延迟（约170ms）
    key_repeat_interval = 5  # 重复移动的间隔（约85ms）

    running = True
    while running:
        counter += 1

        # ============ 事件处理 ============
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.KEYDOWN:
                # 游戏结束状态
                if game.state == "gameover":
                    if event.key in [pygame.K_r, pygame.K_SPACE]:
                        game = Tetris(20, 10, sound_manager)
                        game.new_figure()
                        game.state = "playing"
                        counter = 0
                        keys = {k: 0 for k in keys}

                # 暂停状态
                elif game.state == "paused":
                    if event.key in [pygame.K_p, pygame.K_ESCAPE]:
                        game.state = "playing"
                        sound_manager.play('rotate')

                # 游戏中
                elif game.state == "playing":
                    if event.key == pygame.K_p or event.key == pygame.K_ESCAPE:
                        game.state = "paused"
                        sound_manager.play('rotate')
                    elif event.key == pygame.K_UP:
                        game.rotate()
                    elif event.key in keys:
                        keys[event.key] = 1  # 开始计时

            elif event.type == pygame.KEYUP:
                if event.key in keys:
                    keys[event.key] = 0

        # ============ 持续按键处理 ============
        if game.state == "playing":
            for key in keys:
                if keys[key] > 0:
                    keys[key] += 1

                    # 首次移动：等待初始延迟
                    if keys[key] == key_initial_delay:
                        if key == pygame.K_LEFT:
                            game.go_side(-1)
                        elif key == pygame.K_RIGHT:
                            game.go_side(1)
                        elif key == pygame.K_DOWN:
                            game.go_down()

                    # 重复移动：按照间隔触发
                    elif keys[key] > key_initial_delay:
                        frames_since_last_move = (keys[key] - key_initial_delay) % key_repeat_interval
                        if frames_since_last_move == 0:
                            if key == pygame.K_LEFT:
                                game.go_side(-1)
                            elif key == pygame.K_RIGHT:
                                game.go_side(1)
                            elif key == pygame.K_DOWN:
                                game.go_down()

        # ============ 游戏逻辑更新 ============
        if game.state == "playing":
            # 自动下落
            drop_speed = game.get_drop_speed()
            if counter % drop_speed == 0:
                game.go_down()

            # 更新粒子
            game.update_particles()

        # ============ 绘制 ============
        draw_game(screen, game, fonts)
        pygame.display.flip()
        clock.tick(fps)

    pygame.quit()
    sys.exit()

if __name__ == '__main__':
    main()
