/*
* IoT Hub Raspberry Pi NodeJS - Microsoft Sample Code - Copyright (c) 2017 - Licensed MIT
*/
'use strict';

const fs = require('fs');
const path = require('path');

var i2cBus = {};
var Pca9685Driver = {};
var pwm;

var baseRotationConfig = [0,160,500,180];
var upperArmExtensionConfig = [0,160,500,180];
var lowerArmExtensionConfig = [0,160,500,180];
var wristRollConfig = [0,160,500,180];
var wristTiltConfig = [0,160,500,180];
var handRotationConfig = [0,160,500,180];

const Client = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;

// DPS and connection stuff

const iotHubTransport = require('azure-iot-device-mqtt').Mqtt;

var ProvisioningTransport = require('azure-iot-provisioning-device-mqtt').Mqtt;
var SymmetricKeySecurityClient = require('azure-iot-security-symmetric-key').SymmetricKeySecurityClient;
var ProvisioningDeviceClient = require('azure-iot-provisioning-device').ProvisioningDeviceClient;

var provisioningHost = 'global.azure-devices-provisioning.net';

var client
var config;
var connect;

var sendingMessage = true;

function convertPayload(request) {
	if(typeof(request.payload) == "string") {
		try {
			request.payload = JSON.parse(request.payload);
		}
		catch(e) {

		}
	}
}

function sendUpdatedTelemetry(name,value) {
  if (!sendingMessage) { return; }

  var telemetry = {};
  telemetry[name] = value;

  var rawMessage = JSON.stringify(telemetry);

  console.log("Sending:");
  console.log(rawMessage);

  var message = new Message(rawMessage);

  if (config.infoOutboundMessages)
    console.info('Sending Telemetry Update to Azure IoT Hub');

  if (config.debugOutboundMessages)
    console.debug(rawMessage);

  client.sendEvent(message, (err) => {
    if (err) {
      console.error('Failed to send telemtry to Azure IoT Hub');
    } else {
      if (config.infoOutboundMessages)
        console.info('Telemetry successfully sent to Azure IoT Hub');
    }
  });
}


function onAllOff(request, response) {
  sendingMessage = true;

  if (config.infoMethods)
    console.info("SetAllOff");

  try {
    pwm.channelOff(baseRotationConfig[0]);
    pwm.channelOff(upperArmExtensionConfig[0]);
    pwm.channelOff(lowerArmExtensionConfig[0]);
    pwm.channelOff(wristRollConfig[0]);
    pwm.channelOff(wristTiltConfig[0]);
    pwm.channelOff(handRotationConfig[0]);

    response.send(200, 'Successfully turned all servos off', function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetAllOff method request');
      }
    });
  }
  catch(err) {
    console.error("Error turning off channel : " + err);

    response.send(400, 'Error turning off channel : '+ err, function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetAllOff method request');
      }
    });
  }
}

function setServoPositionScaled(servoConfig,position) {
  if(position < 0)
    position = 0;

  if(position > servoConfig[3])
    position = servoConfig[3];

  var scaledValue = Math.round( servoConfig[1] + ( (position / servoConfig[3]) * (servoConfig[2] - servoConfig[1]) ) );

  console.log('min ' + servoConfig[1]);
  console.log('max ' + servoConfig[2]);
  console.log('range' + servoConfig[3]);
  console.log('scaled position = ' + scaledValue);

  pwm.setPulseRange(servoConfig[0],0,scaledValue);
}

function onSetHandRotation(request, response) {
  sendingMessage = true;

  convertPayload(request);

	var rotation = request.payload.rotation;

  if (config.infoMethods)
    console.info("SetHandRotation");

  try {
    setServoPositionScaled(handRotationConfig,rotation);

    response.send(200, 'Successfully SetHandRotation', function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetHandRotation method request');
      }
    });

    sendUpdatedTelemetry("handRotation",rotation);

  }
  catch(err) {
    console.error("Error calling SetHandRotation : " + err);

    response.send(400, 'Error calling SetHandRotation : '+ err, function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetHandRotation method request');
      }
    });
  }
}

function onSetBaseRotation(request, response) {
  sendingMessage = true;

  convertPayload(request);

	var rotation = request.payload.rotation;

  if (config.infoMethods)
    console.info("SetBaseRotation");

  try {
    setServoPositionScaled(baseRotationConfig,rotation);

    response.send(200, 'Successfully SetBaseRotation', function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetBaseRotation method request');
      }
    });

    sendUpdatedTelemetry("baseRotation",rotation);
  }
  catch(err) {
    console.error("Error calling SetBaseRotation : " + err);

    response.send(400, 'Error calling SetBaseRotation : '+ err, function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetBaseRotation method request');
      }
    });
  }
}

function onSetUpperArmExtension(request, response) {
  sendingMessage = true;

  convertPayload(request);

	var extension = request.payload.extension;

  if (config.infoMethods)
    console.info("SetUpperArmExtension");

  try {
    setServoPositionScaled(upperArmExtensionConfig,upperArmExtensionConfig[3] - extension);

    response.send(200, 'Successfully SetUpperArmExtension', function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetUpperArmExtension method request');
      }
    });

    sendUpdatedTelemetry("upperArmExtension",extension);
  }
  catch(err) {
    console.error("Error calling SetUpperArmExtension : " + err);

    response.send(400, 'Error calling SetUpperArmExtension : '+ err, function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetUpperArmExtension method request');
      }
    });
  }
}

function onSetLowerArmExtension(request, response) {
  sendingMessage = true;

  convertPayload(request);

	var extension = request.payload.extension;

  if (config.infoMethods)
    console.info("SetLowerArmExtension");

  try {
    setServoPositionScaled(lowerArmExtensionConfig,lowerArmExtensionConfig[3] - extension);

    response.send(200, 'Successfully SetLowerArmExtension', function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetLowerArmExtension method request');
      }
    });

    sendUpdatedTelemetry("lowerArmExtension",extension);
  }
  catch(err) {
    console.error("Error calling SetLowerArmExtension : " + err);

    response.send(400, 'Error calling SetLowerArmExtension : '+ err, function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetLowerArmExtension method request');
      }
    });
  }
}

function onSetWristRoll(request, response) {
  sendingMessage = true;

  convertPayload(request);

	var rotation = request.payload.rotation;

  if (config.infoMethods)
    console.info("SetWristRoll");

  try {
    setServoPositionScaled(wristRollConfig,rotation);

    response.send(200, 'Successfully SetWristRoll', function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetWristRoll method request');
      }
    });

    sendUpdatedTelemetry("wristRoll",rotation);
  }
  catch(err) {
    console.error("Error calling SetWristRoll : " + err);

    response.send(400, 'Error calling SetWristRoll : '+ err, function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetWristRoll method request');
      }
    });
  }
}

function onSetWristTilt(request, response) {
  sendingMessage = true;

  convertPayload(request);

	var rotation = request.payload.rotation;

  if (config.infoMethods)
    console.info("SetWristTilt");

  try {
    setServoPositionScaled(wristTiltConfig,rotation);

    response.send(200, 'Successfully SetWristTilt', function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetWristTilt method request');
      }
    });
    sendUpdatedTelemetry("wristTilt",rotation);
  }
  catch(err) {
    console.error("Error calling SetWristTilt : " + err);

    response.send(400, 'Error calling SetWristTilt : '+ err, function (errSend) {
      if (errSend) {
        console.error('Unable to respond to SetWristTilt method request');
      }
    });
  }
}

function onStart(request, response) {
  if (config.infoMethods)
    console.info('Try to invoke method start(' + request.payload || '' + ')');

  sendingMessage = true;

  response.send(200, 'Successully start sending message to cloud', function (err) {
    if (err) {
      console.error('[IoT hub Client] Failed sending a method response:\n' + err.message);
    }
  });
}

function onStop(request, response) {
  if (config.infoMethods)
    console.info('Try to invoke method stop(' + request.payload || '' + ')')

  sendingMessage = false;

  response.send(200, 'Successully stop sending message to cloud', function (err) {
    if (err) {
      console.error('[IoT hub Client] Failed sending a method response:\n' + err.message);
    }
  });
}

function onReceiveMessage(msg) {
  var message = msg.getData().toString('utf-8');

  client.complete(msg, () => {
    if (config.infoInboundMessages)
      console.info('Incoming Message Received');

    if (config.debugInboundMessages)
      console.debug(message);
  });
}

function initBindings() {
    // set C2D and device method callback
    client.onDeviceMethod('start', onStart);
    client.onDeviceMethod('stop', onStop);

    client.onDeviceMethod('SetAllOff', onAllOff);
    client.onDeviceMethod('SetBaseRotation', onSetBaseRotation);
    client.onDeviceMethod('SetLowerArmExtension', onSetLowerArmExtension);
    client.onDeviceMethod('SetUpperArmExtension', onSetUpperArmExtension);
    client.onDeviceMethod('SetWristRoll', onSetWristRoll);
    client.onDeviceMethod('SetWristTilt', onSetWristTilt);
    client.onDeviceMethod('SetHandRotation', onSetHandRotation);

    client.on('message', onReceiveMessage);
}

function initDevice() {
    // Assign axes parameters

    baseRotationConfig = config.baseRotationConfig;
    upperArmExtensionConfig = config.upperArmExtensionConfig;
    lowerArmExtensionConfig = config.lowerArmExtensionConfig;
    wristRollConfig = config.wristRollConfig;
    wristTiltConfig = config.wristTiltConfig;
    handRotationConfig = config.handRotationConfig;

    // Set up servo controller

    try {
      i2cBus = require("i2c-bus");
      Pca9685Driver = require("pca9685").Pca9685Driver;
      
      var options = {
        i2c: i2cBus.openSync(1),
        address: 0x40,
        frequency: 50,
        debug: false
      };

      pwm = new Pca9685Driver(options, function(err) {
        if (err) {
            console.error("Error initializing PCA9685");
            process.exit(-1);
        }

        console.log("Servo initialization done");
      });
    }
    catch(e) {
      console.log("Unable to configure servo controller : " + e);
    }
}

function initLogic() {
    setInterval(() => {
      if (config.infoConfigurationSync)
        console.info("Syncing Device Twin...");

      client.getTwin((err, twin) => {
        if (err) {
          console.error("Get twin message error : " + err);
          return;
        }

        if (config.debugConfigurationSync) {
          console.debug("Desired:");
          console.debug(JSON.stringify(twin.properties.desired));
          console.debug("Reported:");
          console.debug(JSON.stringify(twin.properties.reported));
        }


      });
    }, config.interval);
}

function initClient() {

	// Start the device (connect it to Azure IoT Central).
	try {
		var provisioningSecurityClient = new SymmetricKeySecurityClient(connect.deviceId, connect.symmetricKey);
		var provisioningClient = ProvisioningDeviceClient.create(provisioningHost, connect.idScope, new ProvisioningTransport(), provisioningSecurityClient);

		provisioningClient.register((err, result) => {
			if (err) {
				console.log('error registering device: ' + err);
			} else {
				console.log('registration succeeded');
				console.log('assigned hub=' + result.assignedHub);
				console.log('deviceId=' + result.deviceId);

				var connectionString = 'HostName=' + result.assignedHub + ';DeviceId=' + result.deviceId + ';SharedAccessKey=' + connect.symmetricKey;
				client = Client.fromConnectionString(connectionString, iotHubTransport);
			
				client.open((err) => {
					if (err) {
						console.error('[IoT hub Client] Connect error: ' + err.message);
						return;
					}
					else {
						console.log('[IoT hub Client] Connected Successfully');
					}
			
					initBindings();

					initLogic();
				});
			}
		});
	}
	catch(err) {
		console.log(err);
	}
}

// Read in configuration from config.json

try {
	config = require('./config.json');
} catch (err) {
	config = {};
	console.error('Failed to load config.json: ' + err.message);
	return;
}

// Read in connection details from connect.json

try {
	connect = require('./connect.json');
} catch (err) {
	connect = {};
	console.error('Failed to load connect.json: ' + err.message);
	return;
}

// Perform any device initialization

initDevice();

// Initialize Azure IoT Client

initClient();
