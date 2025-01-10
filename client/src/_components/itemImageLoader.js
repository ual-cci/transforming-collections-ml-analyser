'use client'

import React, {useEffect, useRef, useState, memo, useCallback} from 'react'
import ItemImage from './itemImage'
import Image from 'next/image'

const ItemImageLoader = ({
    item_id, 
    item_storage_id
  }) => {

    const [loadState, setLoadState] = useState("unknown")
    const [image, setImage] = useState("")

    const getImage = useCallback((img_storage_id) => {
        const requestOptions = {
            method: 'GET',
            mode: 'cors',
            headers: {'Content-Type': 'application/json'},
        };

        setLoadState("loading")

        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/item_image?"+ new URLSearchParams({
            item_id:item_id,
            image_storage_id:img_storage_id
        }), requestOptions)
        .then(response => response.json())
        .then(res => {
            if(res.status=="200"){
                setImage("data:image/jpeg;base64,"+ res.data)
                setLoadState("ready")
            } else {
                console.log(res['error'])
                onError(res['error'])
            }
        })
    } ,[])

    useEffect(()=>{
        getImage(item_storage_id)
    },[item_storage_id])

    return (
        <>
        {loadState != "ready" ? (
            <div className="image-placeholder">
                <div>
                    <span id={"image-loading-icon"} className="spinner-border text-primary" role="status"></span>
                </div>
            </div>
        ) : (
            <>
            <ItemImage image_data={image}/>
            </>
        ) 
        }
        </>
    )
        
}

export default memo(ItemImageLoader)
  
  