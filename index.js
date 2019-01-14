const noble = require('noble-mac')
const EventEmitter = require('events')

const HOLMAN_CO3015_SERVICE_UUID = '0a75f000-f9ad-467a-e564-3c19163ad543'
const HOLMAN_CO3011_SERVICE_UUID = 'c521f000-0d70-4d4f-8e43-40d84c50ab38' // model BTX1
const serviceUUIDs = [HOLMAN_CO3011_SERVICE_UUID, HOLMAN_CO3015_SERVICE_UUID]

class HolmanWater extends EventEmitter {
  constructor() {
    super()
    noble.on('discover', (peripheral)=> this._onDiscover(peripheral))
    noble.on('scanStart', ()=> this.emit('scanStart'))
    noble.on('scanStop', ()=> this.emit('scanStop'))
  }

  startDiscover() {
    var allowDuplicates = false
    noble.startScanning(serviceUUIDs, allowDuplicates); // particular UUID's
  }

  stopDiscover() {
    noble.stopScanning();
  }

  _onDiscover(peripheral) {
    this.emit('tap', new HolmanWaterTap(peripheral))
  }
}

// object representing a single Holman smart garden tap device
class HolmanWaterTap extends EventEmitter {
  constructor(peripheral) {
    super()
    this.peripheral = peripheral
    this.service = null
    this.char = {e001: null, f004: null, f005: null, f006: null}
    this.connected = false
  }

  // connect via bluetooth, async, returns promise
  connect() {
    return new Promise((resolve, reject) => {
      this.peripheral.connect((err)=> {
        if (err) return reject(err)
        this.peripheral.discoverServices(serviceUUIDs, (err, services)=> {
          if (err) return reject(err)
          if (services.length < 1) return reject("compatible service not found in device")
          this.service = services[0]
          
          const charUUIDs = ['E001', 'F004', 'F005', 'F006']
          this.service.discoverCharacteristics(charUUIDs, (err, characteristics)=> {
            if (err) return reject(err)
            console.log('connected!', characteristics)
            characteristics.forEach((c) => this.char[c.uuid.toLowerCase()] = c)
            this.connected = true
            resolve(this)
          })
        })
      })
    })
  }

  // disconnect bluetooth
  disconnect() {
    return new Promise((resolve, reject) => {
      this.peripheral.disconnect((err)=> {
        if (err) return reject(err)
        this.connected = false
        resolve(this)
      })
    })
  }

  // get signal strength
  getRSSI() {
    return new Promise((resolve, reject) => {
      this.peripheral.updateRssi((err, rssi)=> {
        if (err) reject(err)
        else resolve(rssi)
      })
    })
  }

  // get current state information
  // TODO: parse this
  getStateData() {
    return new Promise((resolve, reject) => {
      this.char.f004.read((err, raw)=> {
        if (err) reject(err)
        else resolve(raw)
      })
    })
  }

  // get the current clock time in device
  // TODO: figure out what the first four bytes mean in this characteristic
  getTime() {
    return new Promise((resolve, reject) => {
      this.char.f005.read((err, raw)=> {
        if (err) return reject(err)
        let referenceEpoch = 1547448479 - 3150080
        let timestamp = referenceEpoch + raw.readUInt32BE(4)
        var d = new Date()
        d.setTime(timestamp * 1000)
        resolve(d)
      })
    })
  }

  // returns a boolean indicating if the tap is open or closed (t/f)
  isTapOpen() {
    return this.getStateData().then((raw)=> {
      return (raw.readUInt8(8) % 2) == 1
    })
  }

  // set the manual timer to turn the tap on or off, if setting on, duration is used for safety shut off
  setTimer(tapOn, durationMinutes = 1) {
    return new Promise((resolve, reject) => {
      var data = Buffer.from([!!tapOn, 0, durationMinutes / 256, durationMinutes % 256])
      this.char.f006.write(data, false, (err, result)=> {
        if (err) reject(err)
        else resolve(result)
      })
    })
  }
}

// export your device
module.exports = new HolmanWater
