---
services: iot-hub, iot-central
platforms: Nodejs
author: rickb
---

# Azure IoT Hub/IoT Central Sainsmart 6-Axis Robot Interface

This utilizes the Azure IoT Node.js SDK to connect to the a Sainsmart 6 Axis robot.  This connector provides a set of device commands that can be used to reposition the various servo motors on the robot.

# How To Configure This Device Connector

In a connect.json file, you'll need to provide the idScope, deviceId, and connection key that are displayed when you select "Connect" from the device view inside of IoT Central

{
    "idScope" : "0ne00000000",
    "deviceId" : "MyRobot",
    "symmetricKey" : "z11uz4E35gO0Z9uI0PYcVm/twUyAm/iJovuMk8A2xpo=",
}

In the config.json, you specify the mapping between the functional elements of the robot and the servo motor that is connected to that function.  The first parameter is the servo motor I/O channel, the second and third are the limits of movement, and the fourth parameter is the degrees of range of motion for that motor/axis.

  "baseRotationConfig" : [3,148,611,180],
  "upperArmExtensionConfig" : [5,230,560,100],
  "lowerArmExtensionConfig" : [4,166,254,100],
  "wristRollConfig" : [2,166,606,180],
  "wristTiltConfig" : [0,250,431,90],
  "handRotationConfig" : [1,149,558,180]

# How To Run This Device Connector 

Launch index.js to execute this connector.

# Features

This connector allows you to manipulate the position of the various axes of the robot.