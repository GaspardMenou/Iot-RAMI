#ifndef SENSOR
#define SENSOR

#include <DHT.h>
#include <PubSubClient.h>

#define DHTTYPE DHT22
#define DHTPIN 27

void readAndPublishMeasures(PubSubClient& client, const char* topic);
void setupSensor();

#endif
