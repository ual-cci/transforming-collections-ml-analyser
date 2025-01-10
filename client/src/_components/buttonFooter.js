'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from "react";

const ButtonFooter = ({
    buttonTexts=[],
    buttonActions=[],
    buttonData={}
}) => {

    const [data,setData] = useState({})

    useEffect(()=>{
        setData(buttonData)
    },[buttonData])

    const handleClick = (e,i)=>{
        e.preventDefault()
        buttonActions[i](data)
    }

    return (
        <div className={buttonTexts.length > 1 ? "footer multi-button flex" : "footer single-button flex"}>
            {buttonTexts.map(function(b,i){
                return <button key={"footer-button-" + i} type="button" onClick={(e)=>{
                    handleClick(e,i)
                }}>{b}</button>
            })}
        </div>
    )
}

export default ButtonFooter