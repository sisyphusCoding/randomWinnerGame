//SPDX-License-Identifier:MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";


contract RandomGameWinner is VRFConsumerBase , Ownable {


  uint256 public fee;

  bytes32 public keyHash;

  address[] public players;

  uint8 maxPlayers;

  bool public gameStarted;

  uint256 entryFee;

  uint256 public gameId;



  event GameStarted(uint256 gameId , uint8 maxPlayers,uint256 entryFee);

  event PlayerJoined(uint256 gameId , address player);

  event GameEnded(uint256 gameId , address winner, bytes32 requestId);



  constructor(address vrfCoordinator,
              address linkToken,
              bytes32 vrfKeyHash,
              uint256 vrfFee
             ) VRFConsumerBase(vrfCoordinator,linkToken){
               keyHash = vrfKeyHash;
               fee= vrfFee ;
               gameStarted = false;
  }



  function startGame(uint8 _maxPlayers,uint256 _entryFee) 
  public onlyOwner {
    
    require(!gameStarted, 'Game is already running');

    delete players;

    maxPlayers = _maxPlayers;

    gameStarted = true;

    entryFee =  _entryFee;

    gameId += 1;

    emit GameStarted(gameId, maxPlayers, entryFee);

  }



  function joinGame() public payable {
    require(gameStarted, 'Game has not been started');
    require(msg.value == entryFee , 'Value sent is incorrect');

    require(players.length < maxPlayers , 'Game is currently full');

    players.push(msg.sender);


    emit PlayerJoined(gameId, msg.sender);

    if(players.length == maxPlayers){
      getRandomWinner();
    }

  }

  function fulfillRandomness(bytes32 requestId,uint256 randomness
  ) internal virtual override {
    
    uint256 winnerIndex = randomness % players.length;

    address winner = players[winnerIndex];

    (bool sent ,) = winner.call{value:address(this).balance}("");

    require(sent, 'Failed to sent the required value');

    emit GameEnded(gameId, winner, requestId);
  
    gameStarted = false;
 
  }


  function getRandomWinner() private returns(bytes32 requestId) {
    require(LINK.balanceOf(address(this)) >= fee, 'Not enought link');
    return requestRandomness(keyHash , fee);
  }
             



}
