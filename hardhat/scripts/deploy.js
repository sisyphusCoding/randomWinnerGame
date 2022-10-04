 const {ethers} = require('hardhat')
require('dotenv').config({path:'.env'})

const {FEE,VRF_COORDINATOR,LINK_TOKEN,KEY_HASH} = require('../constants')



const main = async () =>{

  const randomGameWinner = await ethers.getContractFactory('RandomGameWinner')

  const thisDeploy = await randomGameWinner.deploy(
    VRF_COORDINATOR,
    LINK_TOKEN,
    KEY_HASH,
    FEE
  )

  await thisDeploy.deployed()

  console.log('Verify Contract Address:',thisDeploy.address)

  console.log('Sleeping....')

  await sleep(30000)

  await hre.run('verify:verify',{
    address:thisDeploy.address,
    constructorArguments: [VRF_COORDINATOR, LINK_TOKEN, KEY_HASH, FEE],
  })

}


function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve , ms))
}


main()
.then(()=>process.exit(0))
.catch((error)=>{
  console.error(error)
  process.exit(1)
})
