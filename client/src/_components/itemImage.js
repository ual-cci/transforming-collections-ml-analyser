'use client'

import React, {useEffect, useRef, useState,  memo} from 'react'
import { Button } from 'react-bootstrap'
import ButtonModal from './buttonModal'

const ItemImage = ({
    image_data
  }) => {

    const handleShow = (e) => {
      e.preventDefault()

    }

    return (
        <>
        <div className="item-image-container">
          <ButtonModal 
            title={"Image Viewer"}
            iconName="fullscreen"
            canCancel={false}
          >
            <img className="item-image" src={image_data} />
          </ButtonModal>
          <img className="item-image-thumbnail" src={image_data} />
        </div>
        </>
    )
        
}

export default memo(ItemImage)
  
  