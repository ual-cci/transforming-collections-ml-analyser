'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

const Button = ({
    type=null,
    content,
    onClick=(e)=>{},
    url=null,
    disabled=false
}) => {
    
    const [isDisabled, setIsDisabled] = useState(false)

    useEffect(()=> {
        setIsDisabled(disabled)
    }, [disabled])

    if (url != null){
        return (
            (!isDisabled) ? (
                <Link href={url}> 
                    <button type={type} onClick={onClick}>{content}</button>
                </Link>
            ) : (
                <Link> 
                    <button type={type} onClick={onClick} disabled={isDisabled}>{content}</button>
                </Link>
            )
        )
    } else {
        return (
            <>
                {(type!= null) ? (
                    <button type={type} disabled={isDisabled} onClick={onClick}>{content}</button>
                ) : (
                    <button disabled={isDisabled} onClick={onClick}>{content}</button>
                )}
            </>
        )
    }

}

export default Button