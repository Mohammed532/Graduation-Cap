#include "filesystem_manager.h"

#include "esp_littlefs.h"
#include "esp_log.h"

static const char* TAG = "LITTLEFS";

void init_filesystem(){
    esp_vfs_littlefs_conf_t cfg = {
        .base_path = "/littlefs",
        .partition_label = "littlefs",
        .format_if_mount_failed = true,
        .dont_mount = false
    };

    ESP_ERROR_CHECK(esp_vfs_littlefs_register(&cfg));

    ESP_LOGI(TAG, "LittleFS Mounted...");
}