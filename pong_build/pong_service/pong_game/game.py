from dataclasses import dataclass
import json
import math
import random


class Vector3:
    x: float
    y: float
    z: float

    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

    def add(self, other):
        self.x += other.x
        self.y += other.y
        self.z += other.z

    def normalize(self):
        length = math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z)
        if length > 0:
            self.x /= length
            self.y /= length
            self.z /= length
        return self

    def multiply_scalar(self, scalar):
        self.x *= scalar
        self.y *= scalar
        self.z *= scalar
        return self



class GameState:

    def __init__(self, players : list[str], game_id : str, match_type="regular"):
        self.init_game_state()
        self.players = players
        self.game_id = game_id
        self.match_type = match_type

    def init_game_state(self):
        self.ball_position = Vector3(0, 0, 0)
        self.ball_velocity = Vector3(0.02, 0, 0.02)
        self.paddle1_position = Vector3(-6.35, 0, 0)
        self.paddle2_position = Vector3(6.35, 0, 0)
        self.p1_score = 0
        self.p2_score = 0
        self.wall_bounds = {
            'top' : 4.3,
            'bottom' : -4.3
        }
        self.speed = 5
        self.ballSpeed = 0.02
        self.winner = None
        self.gameover = False
        self.singleplayer = False
        self.multiplayer = False
        self.Tournament = False

    def to_dict(self):
        return {
            'ballPosition' : {
                'x' : self.ball_position.x,
                'y' : self.ball_position.y,
                'z' : self.ball_position.z,
            },
            'ball_velocity' : {
                'x' : self.ball_velocity.x,
                'y' : self.ball_velocity.y,
                'z' : self.ball_velocity.z,
            },
            'paddle1Position' : {
                'x' : self.paddle1_position.x,
                'y' : self.paddle1_position.y,
                'z' : self.paddle1_position.z,
            },
            'paddle2Position' : {
                'x' : self.paddle2_position.x,
                'y' : self.paddle2_position.y,
                'z' : self.paddle2_position.z,
            },
            'p1Score' : self.p1_score,
            'p2Score' : self.p2_score,
            'wall_bounds' : {
                'top' : 4.3,
                'bottom' : -4.3
            },
            'speed' : self.speed,
            'ballSpeed' : self.ballSpeed,
            'winner' : None,
            'gameover' : False,
            'singleplayer' : self.singleplayer,
            'multiplayer' : self.multiplayer,
            'tournament' : self.Tournament,
            "match_type" : self.match_type

        }

    def updateBall(self):

        # Ball Collided with the Walls
        self.ball_position.add(self.ball_velocity)
        # print(self.)
        if (self.ball_position.z <= self.wall_bounds['bottom'] + 0.5 or 
            self.ball_position.z >= self.wall_bounds['top'] - 0.5):
            self.ball_velocity.z *= -1

        # Determine which player scored
        if self.ball_position.x <= -7.5 or self.ball_position.x >= 7.5:
            if self.ball_position.x < 0:
                self.p2_score += 1
                if self.p2_score > 4:
                    self.gameover = True
                    if not self.singleplayer:
                        self.winner = self.players[1]
                    else:
                        self.winner = "loser"
                        

            else:
                self.p1_score += 1
                if self.p1_score > 4:
                    self.gameover = True
                    self.winner = self.players[0]
    
            self.reset_ball()
        
        # Paddle collision

        for paddle_pos in [self.paddle1_position, self.paddle2_position]:
            paddle_left = paddle_pos.x - 0.150
            paddle_right = paddle_pos.x + 0.150
            paddle_top = paddle_pos.z - 0.95
            paddle_bottom = paddle_pos.z + 0.95
        
            if (self.ball_position.x >= paddle_left and 
                self.ball_position.x <= paddle_right and 
                self.ball_position.z >= paddle_top and 
                self.ball_position.z <= paddle_bottom):
                hit_position = (self.ball_position.z - paddle_pos.z) / 0.75

                self.ball_velocity.x *= -1

                if hit_position < -0.33:
                    self.ball_velocity.z = -abs(self.ball_velocity.z) * 1.5
                elif hit_position > 0.33:
                    self.ball_velocity.z = abs(self.ball_velocity.z) * 1.5
                else:
                    self.ball_velocity.z *= 0.5

                if paddle_pos.x < 0:
                    self.ball_position.x = paddle_right + 0.1
                else:
                    self.ball_position.x = paddle_left - 0.1

                current_speed = math.sqrt(
                    self.ball_velocity.x * self.ball_velocity.x +
                    self.ball_velocity.z * self.ball_velocity.z
                )
                self.ball_velocity.normalize().multiply_scalar(min(current_speed * 1.1, 0.1))

    def update_player_move(self, player_id, action):
        if not self.singleplayer:
            paddle = self.paddle1_position if player_id == self.players[0] else self.paddle2_position
        else:
            paddle = self.paddle1_position
        if action == 'KeyW' and paddle.z - 1.3 > self.wall_bounds['bottom']:
            paddle.z -= self.speed * 0.016
        elif action == 'KeyS' and paddle.z + 1.3 < self.wall_bounds['top']:
            paddle.z += self.speed * 0.016

    def reset_ball(self):
        self.ball_position = Vector3(0, 0, 0)
        self.ball_velocity.x = self.ballSpeed * (1 if random.random() > 0.5 else -1)
        self.ball_velocity.z = self.ballSpeed * (1 if random.random() > 0.5 else -1)
    
    def updateBot(self):
        paddle = self.paddle2_position
        ball = self.ball_position
        if ball.z < 0 and paddle.z >= ball.z and paddle.z - 1.3 > self.wall_bounds['bottom']:
            paddle.z -= self.speed * 0.016
        elif ball.z > 0 and paddle.z <= ball.z and paddle.z + 1.3 < self.wall_bounds['top']:
            paddle.z += self.speed * 0.016
