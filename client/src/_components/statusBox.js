'use client'

import React, { useEffect, useState } from 'react'

const StatusBox = ({
    text="",
    type="status"
}) => {
    
    const [status, setStatus] = useState("")

    useEffect(() => {
        setStatus(text)
    },[text])

    if (status.length > 0){

        return (
            <div className={type+"-box"}>
                <div>
                    {(status.endsWith("...")) ? (<div id="status-loading-icon" className="spinner-border text-primary" role="status"></div>) : (
                        status.startsWith("Error") ? (<span id="status_error" className='material-symbols-outlined'>error</span>) : (
                            <span id="status_complete" className='material-symbols-outlined'>done_outline</span>
                        )
                    )}
                    <span id="status"><b>{status}</b></span>
                </div>
            </div>
        )
    }

}

export default StatusBox