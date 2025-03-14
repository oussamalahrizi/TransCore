from dataclasses import dataclass
import json
import math

@dataclass
class Vector3:
    x: float
    y: float
    z: float

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
    def __init__(self):
        self.ball_position = Vector3(0, 0, 0)
        self.ball_velocity = Vector3(0.07, 0, 0.07)
        self.paddle1_position = Vector3(-6.35, 0, 0)
        self.paddle2_position = Vector3(6.35, 0, 0)
        self.p1_score = 0
        self.p2_score = 0
        self.game_paused = False
        self.game_started = True
        self.single_player = False
        self.wall_bounds = {
            'top': 4.3,
            'bottom': -4.3
        }
        self.speed = 0.09
        self.ball_speed = 0.07

    def to_json(self):
        return {
            'ball_position': {'x': self.ball_position.x, 'y': self.ball_position.y, 'z': self.ball_position.z},
            'paddle1_position': {'x': self.paddle1_position.x, 'y': self.paddle1_position.y, 'z': self.paddle1_position.z},
            'paddle2_position': {'x': self.paddle2_position.x, 'y': self.paddle2_position.y, 'z': self.paddle2_position.z},
            'p1_score': self.p1_score,
            'p2_score': self.p2_score,
            'game_paused': self.game_paused,
            'game_started': self.game_started,
            'single_player': self.single_player
        }

    def update_ball(self):
        if self.game_paused or not self.game_started:
            return

        self.ball_position.add(self.ball_velocity)

        # Wall collisions
        if (self.ball_position.z <= self.wall_bounds['bottom'] + 0.5 or 
            self.ball_position.z >= self.wall_bounds['top'] - 0.5):
            self.ball_velocity.z *= -1

        # Check for scoring
        if self.ball_position.x <= -7.5 or self.ball_position.x >= 7.5:
            if self.ball_position.x < 0:
                self.p2_score += 1
            else:
                self.p1_score += 1

            # Reset ball position
            self.ball_position = Vector3(0, 0, 0)
            self.ball_velocity = Vector3(
                self.ball_speed * (1 if random.random() > 0.5 else -1),
                0,
                self.ball_speed * (1 if random.random() > 0.5 else -1)
            )

            if self.p1_score >= 5 or self.p2_score >= 5:
                self.game_paused = True
                return "game_over"

        # Paddle collision detection
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
                self.ball_velocity.normalize().multiply_scalar(min(current_speed * 1.2, 0.2))

        return None

    def update_player_movement(self, player_id, movement):
        if self.game_paused or not self.game_started:
            return

        paddle = self.paddle1_position if player_id == 1 else self.paddle2_position
        
        if movement == 'up' and paddle.z - 1.25 > self.wall_bounds['bottom']:
            paddle.z -= self.speed
        elif movement == 'down' and paddle.z + 1.25 < self.wall_bounds['top']:
            paddle.z += self.speed

    def update_ai(self):
        if not self.single_player or self.game_paused or not self.game_started:
            return

        if (self.ball_position.z > 0 and 
            self.paddle2_position.z <= self.ball_position.z and 
            self.paddle2_position.z + 1.25 < self.wall_bounds['top']):
            self.paddle2_position.z += self.speed
        elif (self.ball_position.z < 0 and 
              self.paddle2_position.z >= self.ball_position.z and 
              self.paddle2_position.z - 1.25 > self.wall_bounds['bottom']):
            self.paddle2_position.z -= self.speed