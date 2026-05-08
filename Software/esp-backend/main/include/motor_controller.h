#pragma once

void motors_init();

void servo_set_angle(int angle);

void stepper_move_deg(int deg);

void motors_reset();