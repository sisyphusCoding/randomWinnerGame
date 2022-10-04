import { BigNumber, Contract, providers, utils } from 'ethers'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRef, useState,useEffect, useReducer } from 'react'
import Core from 'web3modal'
import Web3Modal from 'web3modal'
import { walletconnect } from 'web3modal/dist/providers/connectors'
import {abi,NFT_ADDRESS} from '../constants'
import {FETCH_CREATED_GAME} from '../queries'
import {subgraphQuery} from '../utils'
import Image from 'next/image'

const Home: NextPage = () => {
    
  interface thisProvider extends providers.Web3Provider{
    getAddress() : Promise<string>
  }


  interface thisSigner extends providers.JsonRpcSigner{
    getAddress() : Promise<string>
  }







  const zero = BigNumber.from('0')

  const [walletConnected, setWalletConnected] = useState<boolean>(false) 
  
  const [loading, setLoading] = useState<boolean>(false)

  const [isOwner, setIsOwner] = useState<boolean>(false)

  const [entryFee, setEntryFee] = useState(zero)

  const [maxPlayers, setMaxPlayers] = useState(0)

  const [gameStarted, setGameStarted] = useState<boolean>(false)

  const [players, setPlayers] = useState([])

  const [winner, setWinner] = useState()

  const [logs, setLogs] = useState([])

  const web3modalRef = useRef<Core>()

  const forceUpdate = useReducer(()=>({}) ,{}) [1]

  const startGame = async() =>{
    try{
      const signer = await getProviderOrSigner(true)

      const NFTContract = new Contract(
        NFT_ADDRESS,
        abi,
        signer
      )

      setLoading(true)

  
      const tx = await NFTContract.startGame(
        maxPlayers,
        entryFee
      )
      await tx.wait()
      setLoading(false)

    }
    catch(err){
      console.error(err)
      setLoading(false)
    }
  }


  const joinGame = async() =>{
    try{
      const signer = await getProviderOrSigner(true)

      const NFTContract = new Contract(
        NFT_ADDRESS,
        abi,
        signer
      )

      setLoading(true)
          const tx = await NFTContract.joinGame({
          value:entryFee
      })

      await tx.wait()
      setLoading(false)
    }

    catch(err){
      console.error(err)
      setLoading(false)
    }
  }

  const checkIfGameStarted = async() => {
    try{
      const provider = await getProviderOrSigner()


      const NFTContract = new Contract(
        NFT_ADDRESS,
        abi,
        provider
      )
  
      const _gameStarted = await NFTContract.gameStarted()

      const _gameArray = await subgraphQuery(FETCH_CREATED_GAME())

      const _game:any = _gameArray.games[0]

      let _logs:any = []

       if(_gameStarted){
        _logs = [`Game has started with ID: ${_game.id}`]
        if(_game.players && _game.players.length > 0){

        _logs.push(
          `${_game.players.length} / ${_game.masxPlayers} already joined 👀`
        )

          _game.players.forEach((player:any)=>{
            _logs.push(`${player} joined  🏃`)
          })
        }

        setEntryFee(BigNumber.from(_game.entryFee))
        setMaxPlayers(_game.masxPlayers)

      }else if(!gameStarted && _game.winner){
        _logs=[
          `Last game has ended with ID: ${_game.id}`,
          `Winner is ${_game.winner}  🎉 `,
          `Waiting for host to start a new game....`
        ]

          setWinner(_game.winner)
          
      }

      setLogs(_logs)
      setPlayers(_game.players)
      setGameStarted(_gameStarted)
      forceUpdate()


    }
    catch(err){console.error(err)}
  }


  const getProviderOrSigner = async (needSigner:boolean = false) =>{
    const provider = await web3modalRef.current?.connect()
  
    const web3Provider = new providers.Web3Provider(provider)
  

    const {chainId} = await web3Provider.getNetwork()

    if(chainId !== 80001){
      window.alert('Change the network to Mumbai')
      throw new Error('Change the network to Mumbai')
    }


    if(needSigner){
      const signer  = web3Provider.getSigner()

      return signer as thisSigner
    }


    return web3Provider as thisProvider

  }



  const connectWallet =  async() => {
    try{
      await getProviderOrSigner()
      setWalletConnected(true)
    }
    catch(err){
      console.error(err)
    }
  }


  const getOwner = async () =>{
    try{

      const provider  = await getProviderOrSigner()

      const NFTContract = new Contract(
        NFT_ADDRESS,
        abi,
        provider
      )

      const _owner = await NFTContract.owner()

      const signer = await getProviderOrSigner(true)

      const _address = await signer.getAddress()

      if(
        _address.toLowerCase() === _owner.toLowerCase()
      ){
          setIsOwner(true)
      }

    }

    catch(error){
      console.error(error)
    }
  }

    

  useEffect(() => {
    if(!walletConnected){
      web3modalRef.current = new Web3Modal ({
        network: 'mumbai',
        providerOptions:{},
        disableInjectedProvider:false
      })
    }
    connectWallet()
    getOwner()
    checkIfGameStarted()
    setInterval(()=>{
      checkIfGameStarted()

    },2*1000)
  }, [])
    

  const renderButton = () =>{
    if(!walletConnected){
      return(
        <div>
            <button className='
            shadow-[0_5px_15px_-5px_rgba(0,0,0,.7)]
            rounded-xl
            bg-purple-800 text-zinc-200 px-4 py-3
            thisButton'>
            Connect your Wallet
          </button>
        </div>
      )
    }
    if(loading){
      return(
        <p className='
          rounded-full
          border-4
          border-l-zinc-800 border-zinc-100
        h-10 w-10 animate-spin
        '/>
      )
    }
    if(gameStarted){
      if(players.length=== maxPlayers){
        return(
          <button
className='            
            rounded-lg shadow-2xl
            bg-purple-600 text-zinc-200 px-4 py-3
' disabled
          >
            Choosing Winner....
          </button>
        )
      }
      return(
      <button
          onClick={joinGame}
          className='
            rounded-lg shadow-2xl
            bg-purple-600 text-zinc-200 px-4 py-3

          '
        >
          Join Game  🚀
        </button>
      )
    }
    if(isOwner && !gameStarted){
      return(
        <section
         className='flex flex-col gap-4 p-5'
         >
          <input 
            className='
            bg-zinc-100 px-4 py-3
            shadow-lg rounded-xl
            '
            type="number"
      onChange={(e)=> {
              // The user will enter the value in ether, we will need to convert
              // it to WEI using parseEther
              setEntryFee(
                e.target.value >= 0
                  ? utils.parseEther(e.target.value.toString())
                  : zero
              );
            }}
            placeholder='Entry Fee (ETH)'
            />
        <input 
         type='number'
        className='
            bg-zinc-100 px-4 py-3
            shadow-lg rounded-xl
            '
        placeholder='Max Players'
         onChange={(e)=>{
         setMaxPlayers(e.target.value ?? 0)
         }}/>

      <button
          onClick={startGame}
          className='
            rounded-lg shadow-2xl
            bg-purple-600 text-zinc-200 px-4 py-3

          '
        >
          Start Game  🚀
        </button>
        </section>
      )
    }

  }


  return (
    <div 
      className='
      bg-zinc-300 text-zinc-600
      min-h-screen min-w-full flex items-center justify-center '
    >
      <Head>
        <title>LW3 Punks</title>
        <meta name="description" content="LW3Punks-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <section
        className='
        bg-zinc-200
        rounded-2xl
        shadow-2xl
        p-5 min-w-[90vmin] lg:min-w-[70vmin]
        flex flex-col lg:flex-row items-center justify-center gap-5
        '
        >
      

        <div
         className='p-5 flex flex-col items-stretch justify-center'
         >
        <h1 className='text-xl lg:text-2xl tracking-tight font-semibold' >Welcome to Random Winner Game!</h1>
        <h3 className=' tracking-tight text-sm lg:text-base ' >Its a lottery game where a winner is chosen at random and wins the
            entire lottery pool.</h3>

        <div
           className='
            min-h-[30vmin] flex 

            items-center justify-center'
           >

        {renderButton()}    
          </div>
        </div>

          <div className='
          overflow-hidden
          p-5
          drop-shadow-2xl
          min-w-[90vmin] lg:min-w-[50vmin]' >
          <Image 
            className='rounded-2xl'
            src='/randomWinner.png'
            height={120} width={200}
            layout='responsive'
            objectFit='cover'
            />
        </div>

      </section>
    </div>
  )
}

export default Home
