import { useState } from 'react'
import { ethers } from 'ethers'
import { NFTStorage } from "nft.storage";
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'

const APIKEY = [process.env.NFT_STORAGE_API_KEY];

import {
  marketplaceAddress
} from '../config'

import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const router = useRouter()

  async function onChange(e) {
    const file = e.target.files[0]
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      const url = `https://ipfs.nftstorage.link/${added.path}`
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  }
  async function uploadToIPFS() {
    const { name, description, price } = formInput
    if (!name || !description || !price || !fileUrl) return
    /* first, upload to IPFS */
    const nftStorage = new NFTStorage({ token: APIKEY, });
    try {
      const metaData = await nftStorage.store({
        name,
        description: name,
        image: inputFile,
      });
      console.log("metadata is: ", { metaData });
      return metaData;
    } catch (error) {
      console.log("Error Uploading Content", error);
    }
  };

  async function listNFTForSale() {
    const url = await uploadToIPFS()
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    /* next, create the item */
    const price = ethers.utils.parseUnits(formInput.price, 'ether')
    let contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()
    let transaction = await contract.createToken(url, price, { value: listingPrice })
    await transaction.wait()
   
    router.push('/')
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12 ">
        <input 
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />
        <input
          placeholder="Asset Price in MATIC"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
        <input
          type="file"
          name="Asset"
          className="my-4 mb-8"
          onChange={onChange}
        />
        <br />
        <div>
        {
          fileUrl  && (
            <>
            <iframe className="rounded mt-4"
              src={fileUrl}
              frameBorder="0"
              //scrolling="auto"
             height="100%"
             width="100%"
            ></iframe>

            </>
          )
        }
        </div>
        <button onClick={listNFTForSale} className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg">
          Create NFT
        </button>
      </div>
    </div>
  )
}
