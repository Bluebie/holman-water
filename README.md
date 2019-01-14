A js/node interface to control and check state of Holman garden watering devices
like the BTX1. Based on https://github.com/scottmckenzie/holman-linux-python

Requires noble-mac for bluetooth le access, which will need xcode on mac or bluez on linux
regular noble doesn't work reliably on macOS but noble-mac should default back to noble on
other platforms
