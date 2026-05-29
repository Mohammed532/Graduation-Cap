#include "filesystem_manager.h"

#include "esp_littlefs.h"
#include "esp_log.h"
#include "esp_err.h"

#include "dirent.h"

static const char* TAG = "LITTLEFS";

/**
 * INTERNAL FUNCTION
 * @brief test function used for checking successful mounting
 */
void check_mounted_dir(){
    DIR* dir = opendir("/littlefs");

    if(dir == NULL){
        ESP_LOGE(TAG, "Failed to open directory");
    } else {
        struct dirent* entry;
        while((entry = readdir(dir)) != NULL){
            ESP_LOGI(TAG, "FILE: %s", entry->d_name);
        }

        closedir(dir);
    }
}

void init_filesystem(){
    esp_vfs_littlefs_conf_t cfg = {
        .base_path = "/littlefs",
        .partition_label = "littlefs",
        .format_if_mount_failed = true,
        .dont_mount = false
    };

    ESP_ERROR_CHECK(esp_vfs_littlefs_register(&cfg));

    ESP_LOGI(TAG, "LittleFS Mounted...");

    // check to see if mount was successful
    check_mounted_dir();
}
