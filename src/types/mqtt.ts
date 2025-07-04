export interface Message {
  _topic: string;
  _timestamp: string;
  type: string;
  before?: any;
  after?: any;
  [key: string]: any;
}

export interface MqttSettings {
  mqtt_broker: string;
  mqtt_port: string;
  mqtt_username: string;
  mqtt_password: string;
} 