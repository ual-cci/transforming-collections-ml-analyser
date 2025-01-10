'use client'

import React, {useEffect, useRef, useState} from 'react'
import Select from 'react-select';
import { getItemListingID } from '@/_helpers/utills'

const options = [
  { value: 0, label: 0 },
  { value: 1, label: 1 },
  { value: 2, label: 2 },
  { value: 3, label: 3 },
  { value: 4, label: 4 },
  { value: 5, label: 5 }
]

const ItemScoreSelector = ({
    ref_id, // Either analyser_id or labelset_id
    item_id,
    itemLabels,
    onChange
}) => {
    
    const [selectedOption, setSelectedOption] = useState('value' in itemLabels[0] ? options[itemLabels[0]['value']] : null)
    const [status, setStatus] = useState("none")

    const id = getItemListingID(item_id,0)

    useEffect(()=>{
      setStatus('none')
    },[])

    const updateScore = (score) => {  

        setStatus("saving")

        setSelectedOption(score)

        const requestOptions = {
            method: 'POST',
            mode: 'cors',
            headers: {'Content-Type': 'application/json'}
        };    
    
        try {
          return fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/update_label?" + new URLSearchParams({
            "labelset_id":ref_id,
            "id": id,
            "score": score == null ? "empty" : score['value']
          }),requestOptions)
          .then(response => response.json())
          .then(
            res => {
              console.log(res)
              setStatus("none")
              onChange()
            }
          )
        } catch (e){
          console.log("ERROR")
          console.log(e)
        } 
    }

    if (itemLabels != undefined)  {

      if (status == "saving"){

        return (
          <div>
          <span id={id+"-checkbox-loading-icon"} className="spinner-border text-primary" role="status"></span>
          <Select
            value={"..."}
            defaultValue={"..."}
            onChange={updateScore}
            options={options}
            isClearable={true}
            placeholder={""}
            />
          </div>
        )

      } else {
        return (
            <Select
            value={selectedOption}
            defaultValue={selectedOption}
            onChange={updateScore}
            options={options}
            isClearable={true}
            placeholder={""}
            />
        )
      }

    }

}

export default ItemScoreSelector