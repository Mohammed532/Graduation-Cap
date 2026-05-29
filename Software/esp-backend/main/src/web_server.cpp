#include "web_server.h"

#include "esp_http_server.h"
#include "esp_log.h"
#include <sys/stat.h>
#include <string>

static const char* TAG = "WEBSERVER";
static const short int CHUNKSIZE = 2048; //2KB buffer chunk

/**
 * INTERNAL FUNCTION
 * @brief used to return proper content type of requested file
 */
static std::string get_content_type(const std::string& path){
    if (path.ends_with(".html")) return "text/html";
    if (path.ends_with(".js")) return "text/javascript";
    if (path.ends_with(".css")) return "text/css";
    if (path.ends_with(".png")) return "image/png";
    if (path.ends_with(".jpg")) return "image/jpeg";
    if (path.ends_with(".svg")) return "image/svg+xml";

    return "text/plain";
}

/**
 * INTERNAL FUNCTION
 * @brief handler function for sending requested files thru http
 */
static esp_err_t file_handler(httpd_req_t* req){
    std::string path = "/littlefs";

    if(strcmp(req->uri, "/") == 0) {
        path += "/index.html";
    } else {
        path += req->uri;
    }

    ESP_LOGI(TAG, "Serving file: %s", path.c_str());

    // checks to see if requested file exists
    struct stat st;
    if(stat(path.c_str(), &st) != 0){
        ESP_LOGE(TAG, "File not found");
        httpd_resp_send_404(req);
        return ESP_FAIL;
    }

    FILE* file = fopen(path.c_str(), "rb");
    setvbuf(file, NULL, _IOFBF, CHUNKSIZE);
    if(!file){
        ESP_LOGE(TAG, "File is null");
        httpd_resp_send_404(req);
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Content-Type: %s", get_content_type(path).c_str());
    std::string content_type = get_content_type(path);
    httpd_resp_set_type(req, content_type.c_str());
    httpd_resp_set_hdr(req, "Cache-Control", "max-age=3600");
    httpd_resp_set_hdr(req, "Connection", "close");

    static char chunk[CHUNKSIZE]; // http task stack too small, moves to static memory
    size_t byte_read;

    while((byte_read = fread(chunk, 1, sizeof(chunk), file)) > 0) {
        esp_err_t ret = httpd_resp_send_chunk(req, chunk, byte_read);
        if(ret != ESP_OK){
            fclose(file);
            ESP_LOGE(TAG, "Send fail");
            httpd_resp_sendstr_chunk(req, NULL);
            return ESP_FAIL;
        }
        vTaskDelay(1); // allows for wifi task to run completely and TCP to flush properly
    }

    fclose(file);

    // done sending chunks, prevents connecting timeout
    httpd_resp_send_chunk(req, NULL, 0);

    return ESP_OK;
}

void start_web_server(){
    httpd_config_t cfg = HTTPD_DEFAULT_CONFIG();
    cfg.uri_match_fn = httpd_uri_match_wildcard;
    cfg.stack_size = 16384;

    httpd_handle_t server = NULL;
    ESP_ERROR_CHECK(httpd_start(&server, &cfg));

    httpd_uri_t file_uri = {
        .uri = "/*",
        .method = HTTP_GET,
        .handler = file_handler,
        .user_ctx = NULL
    };

    httpd_register_uri_handler(server, &file_uri);

    ESP_LOGI(TAG, "Web server started...");
}