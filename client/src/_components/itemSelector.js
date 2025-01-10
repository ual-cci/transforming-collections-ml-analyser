'use client'
 
import ItemDynamicList from './itemDynamicList'
import Button from './button'
import LabelsetSelector from './labelsetSelector'
import { useState, useEffect, memo } from 'react'

const ItemSelector = ({
    user_id="",
    analyser_id="",
    dataset={"_id:":"",name:"",artworks:[],type:""},
    labelset={"_id":"",labels:[]},
    labelset_type="",
    labelset_id="",
    examples=[],
    sample_ids=[],
    predictions=[],
    enableLabelling=false,
    enableExampleSelection=false,
    enableSampleSelection=false,
    showLabels=false,
    showExamples=false,
    showPredictions=false,
    showSample=false,
    showGrade=false,
    selector_type="examples",
    sample_type="online",
    expand_mode="",
    onConfigChanged=()=>{},
    onLabelsChanged=()=>{},
    onExamplesChanged=()=>{},
    onSampleChanged=()=>{},
    onError=()=>{},
    useTab=false,
    model_source=""
  }) => {


    const [num_examples, setNumExamples] = useState("5")
    const [auto_select_examples, setAutoExamplesFlag] = useState("false")
    const [examples_start_index, setExamplesStartIndex] = useState("0")
    const [examples_end_index, setExamplesEndIndex] = useState("0")

    const [num_predictions, setNumPredictions] = useState("20")
    const [auto_select_sample, setAutoSampleFlag] = useState("false")
    const [preds_start_index, setPredsStartIndex] = useState("0")
    const [preds_end_index, setPredsEndIndex] = useState("0")

    const [showRobotItems, setShowRobotItems] = useState(true)

    useEffect(() => {
      let new_config={}

      if(selector_type=="examples"){
        new_config = {
          "num_examples":num_examples,
          "auto_select_examples":auto_select_examples,
          "examples_start_index":examples_start_index,
          "examples_end_index":examples_end_index
        }
      } else if(selector_type=="predictions"){
        new_config = {
          "num_predictions":num_predictions,
          "auto_select_sample":auto_select_sample,
          "preds_start_index":preds_start_index,
          "preds_end_index":preds_end_index
        }
      }

      onConfigChanged(new_config)
    }, [num_examples,auto_select_examples,examples_start_index,examples_end_index,num_predictions,auto_select_sample,preds_start_index,preds_end_index])

    useEffect(() => {
      let new_config = {}

      if(selector_type=="examples"){
        if (dataset.artworks.length > 0 && examples_end_index == "0"){
          setExamplesEndIndex(dataset.artworks.length)
          if (dataset.artworks.length < num_examples) {
            setNumExamples(dataset.artworks.length)
          }
        }
        new_config = {
          "num_examples":num_examples,
          "auto_select_examples":auto_select_examples,
          "examples_start_index":examples_start_index,
          "examples_end_index":examples_end_index
        }
      } else if(selector_type=="predictions"){
        if (dataset.artworks.length > 0 && preds_end_index == "0"){
          setPredsEndIndex(dataset.artworks.length)
          if (dataset.artworks.length < num_predictions) {
            setNumPredictions(dataset.artworks.length)
          }
        }
        new_config = {
          "num_predictions":num_predictions,
          "auto_select_sample":auto_select_sample,
          "preds_start_index":preds_start_index,
          "preds_end_index":preds_end_index
        }
      }
      onConfigChanged(new_config)
    }, [dataset])

    return (

    <>
        {/* auto-selection hidden as it needs more work */}
        {/* <div className='example-selector-config'>
              {(selector_type == "examples") ? (
                <>
                {enableLabelling ? (
                <div className={auto_select_examples=="true" ? "item-selector-auto-toggle" : "item-selector-auto-toggle auto-select-enabled"}>
                  <span>
                    <label>Allow system to auto-select examples? </label>
                    <select value={auto_select_examples} onChange={(e) => {setAutoExamplesFlag(e.target.value)}}>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </span>
                  {auto_select_examples=="true" ? (
                    <>
                    <br/>
                    <span className="soft-warning">Note: Choosing "Yes" means your example selection will be replaced each time you update the analyser.</span><br/>
                    <span className="soft-warning"><b>Change this setting to "No" to keep your current selection.</b></span>
                    </>
                  )  : (
                    <></>
                  )}
                </div>
                ) : (<></>)}
                {enableLabelling && auto_select_examples == "true" ? (
                  <>
                  <br/>
                  <div className='item-selector-auto-config'>
                    <span>Auto-selection settings: </span>
                    <span>
                      <label>Number of examples </label>
                      <input placeholder={"0 - 20"} value={num_examples} onChange={(e) => {setNumExamples(e.target.value)}}></input> 
                    </span>
                    <span>
                      <label>Start from</label>
                      <input placeholder={"Order #"} value={examples_start_index} onChange={(e) => {setExamplesStartIndex(e.target.value)}}></input>
                    </span>
                    <span>
                      <label>End at</label>
                      <input placeholder={"Order #"} value={examples_end_index} onChange={(e) => {setExamplesEndIndex(e.target.value)}}></input>
                    </span>
                  </div>
                </>
                ) : (<></>)}
                </>
              ) : (
                <>
                  <div className={auto_select_sample=="true" ? "item-selector-auto-toggle" : "item-selector-auto-toggle auto-select-enabled"}>
                    <span>
                      <label>Allow system to auto-select items?</label>
                      <select value={auto_select_sample} onChange={(e) => {setAutoSampleFlag(e.target.value)}}>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </span>
                    {auto_select_sample=="true" ? (
                      <>
                      <br/>
                      <span className="soft-warning">Note: Your example selection will be replaced each time you update.</span><br/>
                      <span className="soft-warning"><b> Change this setting to "No" to keep your current selection.</b></span>
                      </>
                    )  : (
                      <></>
                    )}
                  </div>
                  {auto_select_sample == "true" ? (
                    <>
                    <br/>
                    <div className="item-selector-auto-config">
                      <span>Auto-selection settings: </span>
                      <span>
                        <label>Number of predictions</label>
                        <input placeholder={"0 - 100"} value={num_predictions} onChange={(e) => {setNumPredictions(e.target.value)}}></input> 
                      </span>
                      <span>
                        <label>Start from</label>
                        <input placeholder={"Order #"} value={preds_start_index} onChange={(e) => {setPredsStartIndex(e.target.value)}}></input>
                      </span>
                      <span>
                        <label>End at</label>
                        <input placeholder={"Order #"} value={preds_end_index} onChange={(e) => {setPredsEndIndex(e.target.value)}}></input>
                      </span>
                    </div>
                    </>
                  ) : (<></>)}
                </>
              )}

      </div> */}

      <ItemDynamicList 
        labelset_id={labelset_id}
        labelset_type={labelset_type}
        dataset={dataset} 
        labelset={labelset}
        predictions={predictions}
        examples={examples}
        sample_ids={sample_ids}
        enableExampleSelection={enableExampleSelection && auto_select_examples!="true"}
        enableSampleSelection={auto_select_sample=="false" && selector_type == "predictions"}
        enableLabelling={enableLabelling}
        showLabels={showLabels}
        showPredictions={showPredictions}
        showExamples={showExamples}
        showSample={showSample}
        showGrade={showGrade}
        showRobotItems={showRobotItems}
        onLabelsChanged={onLabelsChanged}
        onExamplesChanged={onExamplesChanged}
        onSampleChanged={onSampleChanged}
        analyser_id={analyser_id}
        expand_mode={auto_select_examples!="true" && auto_select_sample!="true" ? expand_mode : "fully-expanded"}
        useTab={useTab}
        model_source={model_source}
      />

    </>
  );
          
        
}
  
export default ItemSelector