'use client'

import React, {useEffect, useRef, useState} from 'react'

const LabelsetSelector = ({
    selector_type,
    user_id,
    dataset_id,
    analyser_type,
    analyser_name,
    enableLabelsetCreate=true,
    enableLabelsetCopy,
    onLabelsetSelect,
    onLabelsetCreate,
    defaultValue=null,
    setNewAnalyserLabelsetName,
    setChosenLabelsetID
}) => {

    const [labelsets, setLabelsets] = useState([])
    const [new_labelset_name, setNewLabelsetName] = useState("")
    const [new_labelset_type, setNewLabelsetType] = useState("binary")
    const [labelset_id, setLabelsetId] = useState("0")
    const [copied_labelset_id, setCopiedLabelsetId] = useState("")
    const [created_labelset_id, setCreatedLabelsetId] = useState("")
    const [showTooltip, setShowTooltip] = useState(false)
    const [newLabelsets, setNewLabelsets] = useState([])

    const formatLabelsetType = (labelset_type) => {

        let text = ""
        if (labelset_type == 'binary') {
          text = "Classify True or False"
        } else if (labelset_type == 'score'){
          text = "Give a score (0-5)"
        } else if  (labelset_type == 'keywords'){
          text = "Count keywords"
        }
        return text
      }

    const formatLabelsetName = (labelset_name, labelset_type, option_labelset_id) => {
        let text = ""

        if (selector_type === 'viewanalyser' && !newLabelsets.includes(option_labelset_id)) {
            text = '[Copy] ' + labelset_name + ' (' + formatLabelsetType(labelset_type) + ')'
        } else {
            text = labelset_name + ' (' + formatLabelsetType(labelset_type) + ')'
        }
        return text
    }

    const getLabelsets = () => {
        if (analyser_type != null) {
            fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelsets?" + new URLSearchParams({
                dataset_id:dataset_id,
                label_type:analyser_type,
                user_id:user_id
            }))
            .then(
                response => response.json()
            ).then(
                res => {
                setLabelsets(res.data)
                }
            ) 
        } else {
            fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelsets?" + new URLSearchParams({
                dataset_id:dataset_id,
                user_id:user_id
            }))
            .then(
                response => response.json()
            ).then(
                res => {
                setLabelsets(res.data)
                }
            )
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (new_labelset_name.length>0){
            createLabelset(new_labelset_name)
        } else {
            if (selector_type === 'use-analyser') {
                if (analyser_name.length>0) {
                    let name = '"' +  analyser_name + '" Analyser – Labels'
                    setNewLabelsetName(name)
                    createLabelset(name)
                } else {
                    setShowTooltip(true)
                }
            } else {
                setShowTooltip(true)
            }
        }
    }

    const handleCopy = (e) => {
        e.preventDefault();
        if (new_labelset_name.length>0){
            copyLabelset(new_labelset_name)
        } else {
            if (analyser_name.length>0){
                let name = '"' +  analyser_name + '" Analyser – Labels'
                setNewLabelsetName(name)
                copyLabelset(name)
            } else {
                setShowTooltip(true)
            }
        }
    }

    const copyLabelset = (name) => {

        const requestOptions = {
          method: 'GET',
          mode: 'cors',
          headers: {'Content-Type': 'application/json'}
        };
    
        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelset_copy?" + new URLSearchParams({
          labelset_id:labelset_id,
          owner_id: user_id,
          name:name
        }), requestOptions)
        .then(res => res.json()).then((res) => {
            let labelset_id = res.data
            setNewLabelsetName("")
            setCopiedLabelsetId(labelset_id)
            setLabelsetId(labelset_id)
            setNewLabelsets([...newLabelsets, labelset_id])
            setShowTooltip(false)
            onLabelsetCreate(labelset_id)
        })
    }
  
    const createLabelset = (name) => {
        console.log(dataset_id)

        const requestOptions = {
            method: 'GET',
            mode: 'cors',
            headers: {'Content-Type': 'application/json'}
        };

        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelset_new?" + new URLSearchParams({
            owner_id: user_id,
            name:name,
            type:new_labelset_type, 
            dataset_id: dataset_id
        }), requestOptions)
        .then(res => res.json()).then((res) => {
            let labelset_id = res.data
            setNewLabelsetName("")
            setCreatedLabelsetId(labelset_id)
            setLabelsetId(labelset_id)
            setNewLabelsets([...newLabelsets, labelset_id])
            setShowTooltip(false)
            onLabelsetCreate(labelset_id)
        })
    }

    useEffect(() => {
        if (dataset_id!= (null || "")) {
            getLabelsets()
        }
    }, [dataset_id])

    useEffect(() => {
        if (analyser_type!= null){
            setNewLabelsetType(analyser_type)
            getLabelsets()
        }
    }, [analyser_type])

    useEffect(() => {
        if (new_labelset_name == ""){
            getLabelsets()
        }
        if (selector_type == 'viewanalyser') {
            setNewAnalyserLabelsetName(new_labelset_name)
        }
    }, [new_labelset_name])

    useEffect(() => {
        if (selector_type == 'viewanalyser') {
            setChosenLabelsetID(labelset_id)
        }
    }, [labelset_id])

    useEffect(() => {
        if (defaultValue!=null){
            setLabelsetId(defaultValue)
        } 
    }, [defaultValue])

    return (
        <>
        {(labelsets.length>0 && selector_type=="use-analyser") || (selector_type!="use-analyser")  ? (
            <div className='labelset-selector'>
                <div>
                    <label><span className="label-header">{selector_type=="use-analyser" ? ("Labelset (Optional):") : ("Labelset:") }</span></label>
                    <select name="labelset_id" required 
                        onChange={(e) => {
                            console.log(e.target.value)
                            setLabelsetId(e.target.value)
                            onLabelsetSelect(e.target.value)
                        }} 
                        value={labelset_id}
                    >
                        <option value="0">Select a labelset</option>
                        {selector_type!="use-analyser" ? (
                            <option value="-1">* Start new labelset *</option>
                        ) : (<></>)}
                        {labelsets.length > 0 ? (
                            <>
                            {labelsets.map(function(labelset_item) {
                                return (<option key={labelset_item._id} value={labelset_item._id}>{formatLabelsetName(labelset_item.name, labelset_item.label_type, labelset_item._id)}</option>)
                            })}
                            </>
                        ) : <></>}
                    </select>
                </div>
            {(selector_type === 'viewdataset' && labelset_id == "-1") || (selector_type !== 'viewdataset') ? (
                <>
                {enableLabelsetCreate && (labelset_id!="0") && (labelset_id!=copied_labelset_id) && (labelset_id!=created_labelset_id) ? (
                    <>
                        <div>
                            <label><b>New Labelset Name: </b></label>
                            <input type="text" name="name" value={new_labelset_name} onChange={e => setNewLabelsetName(e.target.value)} placeholder="New labelset name"/>
                        </div>
                        {selector_type === 'viewdataset' ? (
                            <>
                            <div>
                                <label><span className="label-header">Label Type:</span></label>
                                <select name="labelset_type" onChange={e => setNewLabelsetType(e.target.value)}
                                defaultValue={Object.keys(new_labelset_type).length!=0 ? new_labelset_type : 'binary'} >
                                    <option value="binary">{formatLabelsetType("binary")}</option>
                                    <option value="score">{formatLabelsetType("score")}</option>
                                </select> 
                            </div>
                            </>
                            ):<></>
                        }
                        {selector_type != "viewanalyser" ? (
                            <>
                            {labelset_id != "0" && labelset_id != "-1" ? (
                                <button className="inline" onClick={handleCopy}>Start Labelling</button>
                            ) : (
                                <button className="inline" onClick={handleSubmit}>Start Labelling</button>
                            )}
                            </>
                        ) : (
                            <></>
                        )} 
                        {selector_type === 'viewdataset' ? (
                            <>
                            <span className={"form-error" + (showTooltip ? "" : " hidden")}>Please enter a name for your labelset</span>
                            </>
                        ) : (
                            <>
                            <span className={"form-error" + (showTooltip ? "" : " hidden")}>Please enter a name for your labelset or your analyser</span>
                            </>
                        )}
                    </>
                ): <></>}
                </>
            ) : (<></>)}
            </div>
        ) : (<></>)}
        </>
    )
}

export default LabelsetSelector