'use client'

import React from "react";
import { useState, useEffect } from "react";


const Checkbox = ({
  outer_id,
  id,
  initialValue,
  isDisabled, // not currently used in code
  onChecked,
  label,
  ref_id,
  isAsync=true
}) => {

    const [checked, setChecked] = useState(false)
    const [status, setStatus] = useState("none")
    
    useEffect(()=>{

        if (label == "positive"){
            if (initialValue == 1) {
                setChecked(true)
            } else {
                setChecked(false)
            }
        } else if (label == "negative"){
            if (initialValue === 0 && initialValue!== "" && initialValue!==null) {
                setChecked(true)
            } else {
                setChecked(false)
            }
        } else {
            if (initialValue == 1) {
                setChecked(true)
            } else {
                setChecked(false)
            }
        }

        setStatus('none')

    }, [initialValue])

    const onChangeHandler = (e) =>{
        if (isAsync){
            setStatus('saving')
        }
        onChecked(e,ref_id)
        setChecked(JSON.parse(e.target.checked))
    }

    if (status == 'none'){
        return(
            <p id={outer_id} key={outer_id}>
                <input type="checkbox" id={id} disabled={isDisabled} checked={checked} onChange={onChangeHandler}></input>
            </p>
        )
    } else if (status == 'saving'){
        return(
            <p id={outer_id} key={outer_id}>
                <input type="checkbox" id={id} disabled={true} checked={checked} onChange={onChangeHandler}></input>
                <span id={id+"-checkbox-loading-icon"} className="spinner-border text-primary" role="status"></span>
            </p>
        )
    }
}
  
export default Checkbox