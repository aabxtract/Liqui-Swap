// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title MyNFT
 * @dev ERC721 NFT contract with minting capabilities
 */
contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Maximum supply of NFTs
    uint256 public maxSupply = 10000;
    
    // Mint price in wei
    uint256 public mintPrice = 0.01 ether;
    
    // Maximum NFTs per transaction
    uint256 public maxMintPerTx = 10;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Minting status
    bool public mintingEnabled = false;
    
    // Events
    event NFTMinted(address indexed minter, uint256 indexed tokenId);
    event MintingStatusChanged(bool status);
    event MintPriceChanged(uint256 newPrice);
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
    }
    
    /**
     * @dev Base URI for computing tokenURI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Mint a single NFT
     */
    function mint() public payable {
        require(mintingEnabled, "Minting is not enabled");
        require(_tokenIdCounter.current() < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(msg.sender, tokenId);
        
        emit NFTMinted(msg.sender, tokenId);
    }
    
    /**
     * @dev Mint multiple NFTs
     */
    function mintMultiple(uint256 quantity) public payable {
        require(mintingEnabled, "Minting is not enabled");
        require(quantity > 0 && quantity <= maxMintPerTx, "Invalid quantity");
        require(_tokenIdCounter.current() + quantity <= maxSupply, "Exceeds max supply");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(msg.sender, tokenId);
            emit NFTMinted(msg.sender, tokenId);
        }
    }
    
    /**
     * @dev Owner mint (free mint for contract owner)
     */
    function ownerMint(address to, uint256 quantity) public onlyOwner {
        require(_tokenIdCounter.current() + quantity <= maxSupply, "Exceeds max supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(to, tokenId);
            emit NFTMinted(to, tokenId);
        }
    }
    
    /**
     * @dev Set token URI for a specific token
     */
    function setTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        _setTokenURI(tokenId, uri);
    }
    
    /**
     * @dev Update base URI
     */
    function setBaseURI(string memory baseTokenURI) public onlyOwner {
        _baseTokenURI = baseTokenURI;
    }
    
    /**
     * @dev Toggle minting status
     */
    function setMintingEnabled(bool status) public onlyOwner {
        mintingEnabled = status;
        emit MintingStatusChanged(status);
    }
    
    /**
     * @dev Update mint price
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
        emit MintPriceChanged(newPrice);
    }
    
    /**
     * @dev Update max supply
     */
    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(newMaxSupply >= _tokenIdCounter.current(), "Cannot set below current supply");
        maxSupply = newMaxSupply;
    }
    
    /**
     * @dev Update max mint per transaction
     */
    function setMaxMintPerTx(uint256 newMax) public onlyOwner {
        maxMintPerTx = newMax;
    }
    
    /**
     * @dev Get total minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Withdraw contract balance
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Override required by Solidity
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Override required by Solidity
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
