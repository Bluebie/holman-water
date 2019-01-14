const HolmanWater = require('./index')

HolmanWater.on('tap', async function(device) {
  console.log('found one!!')
  console.log(device)
  await device.connect()
  console.log('connected')
  let state = await device.getStateData()
  console.log("state = ", state.toString('hex'))
  // turn on the water
  // await device.setTimer(true, 1)
  // console.log("water turned on for 1 minute! will disable in 5 seconds...")
  // setTimeout(() => {
  //   console.log("disabling")
  //   device.setTimer(false).then(()=> console.log("and it should be off!"))
  // }, 5000)

  // // get the timer duration
  // let {tapOn, durationMinutes} = await device.getTimer()
  // console.log("The manual timer is currently " + (tapOn? "on": "off"))
  // console.log("The manual timer duration is currently " + durationMinutes + " mins")
  //0016010a015d005758010100 // manual off
  //0016010a015d005758010100 // manual off still but repeated the check no timestamps in here
  //0016010a015c005659010100 // started 20 mins timer
  //0016010a015c005659010100 // started 10 hour timer
  //0016010a015c005659010100 // started 1 min timer
  //0016010a011e001858010100 // turned off manually
  //0016010a015c005658010100 // let it time out after a 1 min timer
  let tapOpen = await device.isTapOpen()
  console.log("tap is currently open?", tapOpen)
  
  await device.disconnect()
  HolmanWater.stopDiscover()
})

HolmanWater.startDiscover()
