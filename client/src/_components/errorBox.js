'use client'

import React, { useEffect, useState } from 'react'

const ErrorBox = ({
    status={
        text:"",
        type:""
    }
}) => {
    
    const [box_text, setBoxText] = useState("")
    const [box_type, setBoxType] = useState("")

    useEffect(() => {
        setBoxText(status.text)
        setBoxType(status.type)
    },[status])

    if ((typeof(status) == "object") && (status.text.length > 0)){

        if (box_type=="error"){
            return (
                <div className='error-box'>
                    <div>
                        <span id="error_icon" className='material-symbols-outlined'>error</span>
                        <span id="error_text"><b>{box_text}</b></span>
                    </div>
                </div>
            )
        } else if (box_type=="warning"){
            return (
                <div className='warning-box'>
                    <div>
                        <span id="warning_icon" className='material-symbols-outlined'>emoji_objects</span>
                        <span id="warning_text"><b>{box_text}</b></span>
                    </div>
                </div>
            )
        } else {
            return (
                <></>
            )
        }
    } else if (typeof(status) == "string"){
        return (
            <div className='error-box'>
                <div>
                    <span id="error_icon" className='material-symbols-outlined'>error</span>
                    <span id="error_text"><b>{status}</b></span>
                </div>
            </div>
        )
    }

}

export default ErrorBox