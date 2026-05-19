idf_component_register(
    SRCS
        "src/main.cpp"
        "src/wifi_manager.cpp"
        "src/filesystem_manager.cpp"
        # "src/web_server.cpp"
        # "src/matrix_controller.cpp"
        # "src/motor_controller.cpp"

    INCLUDE_DIRS
        "include"
)

# Point LittleFS image gen at react build folder
# littlefs_create_partition_image(
#     littlefs
#     ../../react-frontend/dist
#     FLASH_IN_PROJECTS
# )