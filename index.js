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
const ConnectionString = require('azure-iot-device').ConnectionString;
const Message = require('azure-iot-device').Message;
const Protocol = require('azure-iot-device-mqtt').Mqtt;

var messageId = 0;
var deviceId;
var client
var config;

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

  var content = {
    messageId: ++messageId,
    deviceId: deviceId
  };

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

function initClient(connectionStringParam, credentialPath) {
  var connectionString = ConnectionString.parse(connectionStringParam);
  deviceId = connectionString.DeviceId;

  // fromConnectionString must specify a transport constructor, coming from any transport package.
  client = Client.fromConnectionString(connectionStringParam, Protocol);

  // Configure the client to use X509 authentication if required by the connection string.
  if (connectionString.x509) {
    // Read X.509 certificate and private key.
    // These files should be in the current folder and use the following naming convention:
    // [device name]-cert.pem and [device name]-key.pem, example: myraspberrypi-cert.pem
    var connectionOptions = {
      cert: fs.readFileSync(path.join(credentialPath, deviceId + '-cert.pem')).toString(),
      key: fs.readFileSync(path.join(credentialPath, deviceId + '-key.pem')).toString()
    };

    client.setOptions(connectionOptions);

    console.log('[Device] Using X.509 client certificate authentication');
  }
  return client;
}

(function (connectionString) {
  // read in configuration in config.json
  try {
    config = require('./config.json');
  } catch (err) {
    console.error('Failed to load config.json: ' + err.message);
    return;
  }

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

  // create a client
  // read out the connectionString from process environment
  connectionString = connectionString || process.env['AzureIoTHubDeviceConnectionString'];
  client = initClient(connectionString, config);

  client.open((err) => {
    if (err) {
      console.error('[IoT hub Client] Connect error: ' + err.message);
      return;
    }
    else {
      console.log('[IoT hub Client] Connected Successfully');
    }

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

  });
})(process.argv[2]);
