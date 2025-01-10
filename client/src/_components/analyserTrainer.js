'use client'
 
import ItemDynamicList from './itemDynamicList'
import Button from './button'
import LabelsetSelector from './labelsetSelector'
import { useState, useEffect } from 'react'

const AnalyserTrainer = ({
    user_id="",
    analyser_id="",
    dataset=[{id:"",name:""}],
    predictions=[],
    modelStatus,
    modelAccuracy,
    onTrainModel,
    onGetPredictions,
    onGetAccuracy
  }) => {

    const [buttonData, setButtonData] = useState([{
      content: "Train Model",
      disabled: false
    }, {
      content: "Load Predictions",
      disabled: false
    }])

    const [labelset, setLabelset] = useState({"_id":"",labels:[]})

    const [enableLabelling, setEnableLabelling] = useState(false)
    const [labellingSchema, setLabellingSchema] = useState("0")
    const [chosen_labelset_id, setLabelsetId] = useState("")

    const onLabelsChanged = () => {
      getLabelset()
    }

    const getLabelset = () => {
  
      const requestOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
      };
  
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelset?" + new URLSearchParams({
        labelset_id:chosen_labelset_id,
        include_labels:true
      }), requestOptions)
      .then(res => res.json()).then((res) => {
        setLabelset(res.data)
      })
    }

    const updateButtonData = (data) => {
      let newButtonData = JSON.parse(JSON.stringify(buttonData))
      data.map((button,index) => {
        Object.keys(button).forEach((key) => {
          console.log(newButtonData[index][key])
          newButtonData[index][key] = button[key];
        });
      })
      setButtonData(newButtonData)
    }

    const onButtonOneClick = (e) => {
      onTrainModel(analyser_id)
    }

    const onButtonTwoClick = (e) => {
      onGetPredictions(analyser_id)
    }


    useEffect(() => {
      if(modelStatus == "Unknown" || modelStatus == "Training" || modelStatus == "Untrained"){
        updateButtonData([
          {content: "Train Model"}, {disabled: true}
        ])
      } else if (modelStatus == "Trained"){
        onGetPredictions(analyser_id)
        updateButtonData([
          {content: "Retrain Model"}, {content: "Get New Predictions", disabled: false}
        ])
      }
    }, [modelStatus])

    useEffect(() => {
      if (
        Object.keys(predictions['text']).length > 0
      ){
        onGetAccuracy(analyser_id, dataset.id, 'train')
      }
    }, [predictions])

    useEffect(() => {
      if (chosen_labelset_id!= ""){
        getLabelset()
      }
    }, [chosen_labelset_id])

    useEffect(() => {
      console.log(labelset)
      if (labelset._id!=""){
        setEnableLabelling(true)
      }
    },[labelset])

    return (

        <div className="container">

            <hr />

            <Button
              key={"button-1-" + analyser_id} 
              content={buttonData[0].content} 
              onClick={onButtonOneClick} 
              disabled={buttonData[0].disabled}
            />
            <Button 
              key={"button-2-" + analyser_id}  
              content={buttonData[1].content} 
              onClick={onButtonTwoClick} 
              disabled={buttonData[1].disabled}
            />

            <hr />
            {(labelset["_id"]!="") ? (
              <h3>Labelset: {labelset['name']}</h3>
            ) : <></>}
            <hr/>

            {(labelset.labels != []) ? (
              <LabelsetSelector 
                user_id={user_id}
                dataset_id={dataset["_id"]}
                enableLabelsetCreate={true}
                onLabelsetSelect={(labelset_id) => {setLabelsetId(labelset_id)}}
                onLabelsetCreate={(labelset_id) => {setLabelsetId(labelset_id)}}
              />
            ) : <></>}

            <ItemDynamicList 
              labelset_id={labelset._id}
              dataset={dataset.artworks} 
              labelset={labelset}
              predictions={predictions} 
              enableLabelling={enableLabelling}
              showlabels={enableLabelling}
              onLabelsChanged={onLabelsChanged}
            />

            {
  }

          </div>);
          
        
}
  
export default AnalyserTrainer