#pragma once

#include <string>

struct AppState {
    std::string matrixText = "HELLO";

    int brightness = 64;

    int servoAngle = 90;

    int stepperDegrees = 0;
};

extern AppState appState;