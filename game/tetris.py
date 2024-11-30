import pygame
import random

# 初始化颜色
COLORS = [
    (0, 0, 0),
    (120, 37, 179),
    (100, 179, 179),
    (80, 34, 22),
    (80, 134, 22),
    (180, 34, 22),
    (180, 34, 122),
]

# 定义方块形状
SHAPES = [
    [[1, 5, 9, 13], [4, 5, 6, 7]],  # I
    [[1, 2, 5, 9], [0, 4, 5, 6], [1, 5, 9, 8], [4, 5, 6, 10]],  # J
    [[1, 2, 6, 10], [5, 6, 7, 9], [2, 6, 10, 11], [3, 5, 6, 7]],  # L
    [[1, 2, 5, 6]],  # O
    [[6, 7, 9, 10], [1, 5, 6, 10]],  # S
    [[1, 4, 5, 6], [1, 4, 5, 9], [4, 5, 6, 9], [1, 5, 6, 9]],  # T
    [[4, 5, 9, 10], [2, 6, 5, 9]]  # Z
]

class Tetris:
    def __init__(self, height, width):
        self.height = height
        self.width = width
        self.field = []
        self.score = 0
        self.state = "start"
        self.figure = None
        self.x = 100
        self.y = 60
        self.zoom = 20
        
        self.clear_field()
        
    def clear_field(self):
        self.field = []
        for i in range(self.height):
            new_line = []
            for j in range(self.width):
                new_line.append(0)
            self.field.append(new_line)
            
    def new_figure(self):
        self.figure = Figure(3, 0)
        
    def intersects(self):
        for i in range(4):
            for j in range(4):
                if i * 4 + j in self.figure.image():
                    if (i + self.figure.y > self.height - 1 or
                        j + self.figure.x > self.width - 1 or
                        j + self.figure.x < 0 or
                        self.field[i + self.figure.y][j + self.figure.x] > 0):
                        return True
        return False
        
    def freeze(self):
        for i in range(4):
            for j in range(4):
                if i * 4 + j in self.figure.image():
                    self.field[i + self.figure.y][j + self.figure.x] = self.figure.color
        self.break_lines()
        self.new_figure()
        if self.intersects():
            self.state = "gameover"
            
    def break_lines(self):
        lines = 0
        for i in range(1, self.height):
            zeros = 0
            for j in range(self.width):
                if self.field[i][j] == 0:
                    zeros += 1
            if zeros == 0:
                lines += 1
                for i1 in range(i, 1, -1):
                    for j in range(self.width):
                        self.field[i1][j] = self.field[i1-1][j]
        self.score += lines ** 2
        
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

class Figure:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.type = random.randint(0, len(SHAPES) - 1)
        self.color = random.randint(1, len(COLORS) - 1)
        self.rotation = 0
        
    def image(self):
        return SHAPES[self.type][self.rotation]
        
    def rotate(self):
        self.rotation = (self.rotation + 1) % len(SHAPES[self.type])

def main():
    pygame.init()
    size = (400, 500)
    screen = pygame.display.set_mode(size)
    pygame.display.set_caption("俄罗斯方块")
    
    done = False
    clock = pygame.time.Clock()
    fps = 25
    game = Tetris(20, 10)
    counter = 0
    
    pressing_down = False
    
    while not done:
        if game.figure is None:
            game.new_figure()
        counter += 1
        if counter > 100000:
            counter = 0
            
        if counter % (fps // 2) == 0 or pressing_down:
            if game.state == "start":
                game.go_down()
                
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                done = True
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_UP:
                    game.rotate()
                if event.key == pygame.K_DOWN:
                    pressing_down = True
                if event.key == pygame.K_LEFT:
                    game.go_side(-1)
                if event.key == pygame.K_RIGHT:
                    game.go_side(1)
                    
            if event.type == pygame.KEYUP:
                if event.key == pygame.K_DOWN:
                    pressing_down = False
                    
        screen.fill(COLORS[0])
        
        for i in range(game.height):
            for j in range(game.width):
                pygame.draw.rect(screen, COLORS[game.field[i][j]],
                               [game.x + game.zoom * j, game.y + game.zoom * i, game.zoom-1, game.zoom-1])
                
        if game.figure is not None:
            for i in range(4):
                for j in range(4):
                    p = i * 4 + j
                    if p in game.figure.image():
                        pygame.draw.rect(screen, COLORS[game.figure.color],
                                       [game.x + game.zoom * (j + game.figure.x),
                                        game.y + game.zoom * (i + game.figure.y),
                                        game.zoom-1, game.zoom-1])
                        
        font = pygame.font.SysFont('SimHei', 25, True, False)
        font1 = pygame.font.SysFont('SimHei', 65, True, False)
        text = font.render("分数: " + str(game.score), True, (255,255,255))
        text_game_over = font1.render("游戏结束", True, (255,255,255))
        
        screen.blit(text, [0, 0])
        if game.state == "gameover":
            screen.blit(text_game_over, [20, 200])
            
        pygame.display.flip()
        clock.tick(fps)
        
    pygame.quit()

if __name__ == '__main__':
    main() 