// Header
#include "wifi_manager.h"

#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"

//debugging and logging
#include "esp_log.h"
#include "esp_err.h"

// AP Wifi Config
#define WIFI_AP_SSID            "GraduationCap"
#define WIFI_AP_SSID_LEN        14
#define WIFI_AP_PSSWRD          "capman123"
#define WIFI_AP_MAX_CONNECT     2

static const char* TAG = "WIFI";

void wifi_init_softap(){
    // Init logging
    ESP_LOGI(TAG, "Initializing SoftAP...");

    // Initialize TCP/IP and event loop
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    esp_netif_t* ap_netif = esp_netif_create_default_wifi_ap();
    if (!ap_netif) { ESP_LOGE(TAG, "Failed to init AP config"); return; }
    
    //wifi configuration
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    wifi_config_t wifi_cfg = {
        .ap = {
            .ssid = WIFI_AP_SSID,
            .password = WIFI_AP_PSSWRD,
            .ssid_len = WIFI_AP_SSID_LEN,
            .authmode = WIFI_AUTH_WPA_WPA2_PSK,
            .max_connection = WIFI_AP_MAX_CONNECT,
        }
    }; 

    //Set AP mode
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_AP));
    ESP_ERROR_CHECK(esp_wifi_set_config(
        WIFI_IF_AP,
        &wifi_cfg
    ));

    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "Wifi Access Point Started...");

}
