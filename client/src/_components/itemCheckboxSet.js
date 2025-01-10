'use client'

import Checkbox from './checkbox';
import {getItemListingID} from '../_helpers/utills'
import { useState } from 'react';

const updateLabel = (itemContentId, checkboxStatus, onLabelsChanged, labelset_id, isExclude=false) => {

    const requestOptions = {
        method: 'POST',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
    };    

    let params = {
      "labelset_id":labelset_id,
      "id": itemContentId
    }

    if (isExclude){
      params["exclude"]=checkboxStatus
    } else {
      params["checked"]=checkboxStatus
    }

    try {
      return fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/update_label?" + new URLSearchParams(params),requestOptions)
      .then(response => response.json())
      .then(
        res => {
          console.log(res)
          onLabelsChanged()
        }
      )
    } catch (e){
      console.log("ERROR")
      console.log(e)
    }
}

const updateExample = (itemContentId, checkboxStatus, onExamplesChanged, analyser_id) => {

  if (analyser_id == ""){

    onExamplesChanged(itemContentId,null)

  } else {

    const requestOptions = {
        method: 'POST',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
    };    

    try {
      return fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/update_example?" + new URLSearchParams({
        "analyser_id":analyser_id,
        "id": itemContentId,
        "checked": checkboxStatus,
      }),requestOptions)
      .then(response => response.json())
      .then(
        res => {
          onExamplesChanged(itemContentId,analyser_id)
        }
      )
    } catch (e){
      console.log("ERROR")
      console.log(e)
    }
  }
}

const updateSample = (itemContentId, checkboxStatus, onSampleChanged, analyser_id, setCheckboxStatus) => {

  if (analyser_id == ""){

    onSampleChanged(itemContentId,null)

  } else {

    const requestOptions = {
        method: 'POST',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
    };    

    try {
      return fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/update_sample?" + new URLSearchParams({
        "analyser_id":analyser_id,
        "id": itemContentId,
        "checked": checkboxStatus,
      }),requestOptions)
      .then(response => response.json())
      .then(
        res => {
          onSampleChanged(itemContentId,analyser_id)
        }
      )
    } catch (e){
      console.log("ERROR")
      console.log(e)
    }
  }
}

const ItemCheckboxSet = ({
    ref_id, // Either analyser_id or labelset_id
    checkbox_type,
    item_id, 
    itemLabels, 
    label,
    enableLabelling,
    onChange,
    isAsync=true
}) => {

    const onCheckboxChecked = (e, ref_id) =>{
      if (checkbox_type == "label"){
        updateLabel(e.target.id,e.target.checked,onChange,ref_id,false)
      } else if (checkbox_type == "example") {
        updateExample(e.target.id,e.target.checked,onChange,ref_id)
      } else if (checkbox_type == "local-example") {
        onChange(e.target.id,ref_id)
      } else if (checkbox_type == "sample") {
        onChange(e.target.id,ref_id)
      } else if (checkbox_type == "exclude") {
        updateLabel(e.target.id,e.target.checked,onChange,ref_id,true)
      }
    }

    if (itemLabels != undefined && itemLabels.length>0) {

        const checkbox_id = [label,"checkbox",getItemListingID(item_id,0)].join("-")
        const inner_checkbox_id = ["p",checkbox_id].join("-")
        const isDisabled = !enableLabelling
        let val = ""
        let styling_class = ""

        if ((checkbox_type == "exclude") && ('exclude' in itemLabels[0])){
          val = itemLabels[0]['exclude'].toString() == "true" ? 1 : 0
          styling_class = itemLabels[0]['exclude'].toString() == "true" ? "exclude" : ""
        } else if ('value' in itemLabels[0]){
          val = itemLabels[0]['value']
        } else {
          val = null
        }
        
        return (
            <span key={checkbox_id} className={styling_class}>
                <Checkbox 
                    key={inner_checkbox_id} 
                    inner_id={inner_checkbox_id} 
                    id={checkbox_id} 
                    initialValue={val}
                    isDisabled={isDisabled} 
                    onChecked={onCheckboxChecked} 
                    label={label} 
                    ref_id={ref_id}
                    isAsync={isAsync}
                />
            </span>
        )
    }

}

export default ItemCheckboxSet