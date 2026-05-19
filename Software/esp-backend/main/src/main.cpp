/**
 * @author Mohammed Akinbayo
 */

#include <stdio.h>
#include <inttypes.h>
#include "sdkconfig.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_log.h"
#include "esp_err.h"

#include "wifi_manager.h"
#include "filesystem_manager.h"

extern "C" void app_main() {
    printf("Hello world!\n");
    
    // NVS Flashing
    esp_err_t nfs = nvs_flash_init();
    // Flash error handling (in case of corruption)
    if (
        nfs == ESP_ERR_NVS_NO_FREE_PAGES ||
        nfs == ESP_ERR_NVS_NEW_VERSION_FOUND
    ) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        nfs = nvs_flash_init();
    }

    ESP_ERROR_CHECK(nfs);

    // Wifi Initialization
    wifi_init_softap();

    //Filesystem initialization
    init_filesystem();
}
