'use client'

import React, { useEffect, useState } from 'react'
import Button from './button'

const LoaderButton = (props) => {

    const [status, setStatus] = useState("none")

    useEffect( () => {
        setStatus(props.status)
    },[props.status])

    let onLoaderButtonClick = ((e) => {
        setStatus("loading")
        props.onClick(e)
    })
    
    return (
        <span>
            <Button {...props} onClick={onLoaderButtonClick}></Button> {(status=="loading") ? (<span className="spinner-border text-primary" role="status"></span>) : null}
        </span>
    )

}

export default LoaderButton