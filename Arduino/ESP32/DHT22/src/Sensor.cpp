#include "Sensor.hpp"
#include "MQTTCommonOperations.hpp"

DHT dht(DHTPIN, DHTTYPE);

void setupSensor() {
    dht.begin();
}
void readAndPublishMeasures(PubSubClient& client, const char* topic) {
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    if (isnan(humidity) || isnan(temperature)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
    }
    const char* types[] = {"temperature", "humidity"};
    const float values[] = {temperature, humidity};
    publishMeasures(client, topic, types, values, 2);
}
