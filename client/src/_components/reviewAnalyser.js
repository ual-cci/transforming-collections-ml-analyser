'use client'

import analyser from '@/pages/analyser'
import { useState, useEffect, useRef } from 'react'
import AnalyserVersionList from './analyserVersionList'
import { getGrade, extract_no_filtered } from '@/_helpers/utills'

const ReviewAnalyser = ({
    user_id="",
    analyser_id="",
    analyser_version="",
    analyser_versions=[],
    stored_accuracy="",
    analyser_type="",
    analyser_owner="",
    onVersionChange=()=>{},
    onTargetAccuracyReached=()=>{},
    example_ids=[],
    sample_ids=[],
    unlabelledTestData="",
    setUnlabelledTestData=()=>{},
    predictions
  }) => {

  const [accuracy, setAccuracy] = useState("")
  const [target, setTarget] = useState("0.7")
  const [grade, setGrade] = useState("")

  const getAccuracy = (analyserid) => {

    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'},
    };

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/llm_accuracy?"+ new URLSearchParams({
      analyser_id:analyserid,
    }), requestOptions)
    .then(response => response.json())
    .then(res => {
      if (res.status == "200") {
        setAccuracy(res.data['accuracy'])
        setUnlabelledTestData(res.data['unlabelled_test_data'])
      } else {
        setGrade("unknown")
      }
    })
  }

  useEffect(() => {
    if (stored_accuracy == "" || stored_accuracy==null){
      getAccuracy(analyser_id)
    }else{
      setAccuracy(stored_accuracy)
    }
  },[stored_accuracy])

  useEffect(() => {
    if (unlabelledTestData === "") {
      getAccuracy(analyser_id)
    }
  },[unlabelledTestData])


  useEffect(() => {
    console.log(extract_no_filtered(predictions))
    setGrade(getGrade(target,accuracy))
  },[accuracy,target])

  useEffect(() => {
    if(analyser_id.length==0){
      setAccuracy("")
      setTarget("0.7")
      setGrade("")
    }
  },[analyser_id])

    return (

        <div className="container review-page">
            <div className="grade-box">
              <div className="">
                <span>Grade:</span><br/>
                {grade.length>0 ? (
                  <>
                    <span className={"grade "+grade}>{grade}</span><br/>
                    {(parseFloat(accuracy) > 0) ? (
                      <span>({(parseFloat(accuracy) * 100).toFixed(0) + "%"} Accurate)</span>
                    ) : (
                      <span>0% Accurate</span>
                    )}

                  </>
                ) : (
                  (grade == "unknown") ? (
                    <span>Your grade could not be calculated at this time</span>
                  ) : (
                    <></>
                  )
                )}
              </div>
              <div className="">
                {analyser_type == 'score' ? (
                  <div className='feature-box'>
                    <span className='material-symbols-outlined'>emoji_objects</span>
                    <span><b>Accuracy for scoring means:</b></span>
                    <br></br>
                    <ul>
                    {(parseFloat(accuracy) > 0) ? (
                      <li>{(parseFloat(accuracy) * 100).toFixed(0) + "%"} of the predicted scores are ±1 from the actual scores.</li>
                    ) : (
                      <li>0% of the predicted scores are ±1 from the actual scores.</li>
                    )}
                    <li>This accuracy is based on <b>{(sample_ids.length - unlabelledTestData.length - extract_no_filtered(predictions))}</b> labelled test samples.</li>
                        {unlabelledTestData.length > 0 ? (
                          <li>It does not include <b>{unlabelledTestData.length}</b> unlabelled test samples.</li>
                        ) : (
                          <></>
                        )}
                        {extract_no_filtered(predictions) > 0 ? (
                          <li>It does not include <b>{extract_no_filtered(predictions)}</b> test samples that triggered the content filter.</li>
                        ) : (
                          <></>
                        )}
                        {(sample_ids.filter(item => example_ids.includes(item)).length > 0) && (sample_ids.filter(item => example_ids.includes(item)).length <= sample_ids.length) ? (
                          <li><b>Note: {sample_ids.filter(item => example_ids.includes(item)).length}</b> labelled test samples were also chosen as training examples. 
                          The predictions for those will usually be correct, so the accuracy will be better than when just using test samples that are not used for training. 
                          To assess how the analyser performs on unseen data, we recommend using only test samples that are not used for training.</li>
                        ) : (
                          <></>
                        )}
                    </ul>
                  </div>
                ) : (
                  <div className='feature-box'>
                    <span className='material-symbols-outlined'>emoji_objects</span>
                    <span><b>Accuracy for classifying means:</b></span>
                    <br></br>
                    <ul>
                      {(parseFloat(accuracy) > 0) ? (
                        <li><b>{(parseFloat(accuracy) * 100).toFixed(0) + "%"}</b> of the predicted labels are the same as the actual labels.</li>
                      ) : (
                        <li><b>0%</b> of the predicted labels are the same as the actual labels.</li>
                      )}
                      {(parseFloat(1-accuracy) > 0) ? (
                        <li><b>{(parseFloat(1-accuracy) * 100).toFixed(0) + "%"}</b> of the predicted labels are <b>not</b> the same as the actual labels.</li>
                      ) : (
                        <li><b>0%</b> of the predicted labels are <b>not</b> the same as the actual labels.</li>
                      )} 
                        <li>This accuracy is based on <b>{(sample_ids.length - unlabelledTestData.length - extract_no_filtered(predictions))}</b> labelled test samples.</li>
                        {unlabelledTestData.length > 0 ? (
                          <li>It does not include <b>{unlabelledTestData.length}</b> unlabelled test samples.</li>
                        ) : (
                          <></>
                        )}
                        {extract_no_filtered(predictions) > 0 ? (
                          <li>It does not include <b>{extract_no_filtered(predictions)}</b> test samples that triggered the content filter.</li>
                        ) : (
                          <></>
                        )}
                        {(sample_ids.filter(item => example_ids.includes(item)).length > 0) && (sample_ids.filter(item => example_ids.includes(item)).length <= sample_ids.length) ? (
                          <li><b>Note: {sample_ids.filter(item => example_ids.includes(item)).length}</b> labelled test samples were also chosen as training examples. 
                          The predictions for those will usually be correct, so the accuracy will be better than when just using test samples that are not used for training. 
                          To assess how the analyser performs on unseen data, we recommend using only test samples that are not used for training.</li>
                        ) : (
                          <></>
                        )}
                    </ul>     
                  </div>
                )} 
              </div>
            </div>
            <div className="clear"></div>
            <br/>
            {(analyser_owner == user_id) ? (
              <>
              <div>
                {grade == "A" ? (
                  <div className='feature-box success'>
                    <span>Well done! The analyser has hit your target accuracy.</span>
                  </div>
                ):(
                  <div className='feature-box'>
                    <span className='material-symbols-outlined'>emoji_objects</span>
                    <span><b>Here's some tips to help improve your analyser results:</b></span>
                    <div>
                      <ul>
                        <li>Labels
                          <ul>
                            <li>Make sure your current labels are correct</li>
                            <li>Add more labels to give more accurate data to judge against</li>
                          </ul>
                        </li>
                        <li>Chosen training Examples
                          <ul>
                            <li>Improve the variety: Choose a mixture of difficulty (some easy for a human to judge, some harder)</li>
                            <li>Choose examples with similar language but different results</li>
                            <li>Make sure to include some labelled data that will <b>not</b> be chosen as a training example</li>
                          </ul>
                        </li>
                        <li>Chosen sample for predictions
                          <ul>
                            {/* <li>Try setting auto-select to "Yes" to get an even sample across the dataset</li> */}
                            <li>If selecting manually, try to choose a mixture of training examples and other labelled items</li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <hr></hr>
              <span>
                <form>
                  <label>(Optional) Change Target Accuracy:</label>
                  <select onChange={(e) => {
                    e.preventDefault()
                    setTarget(e.target.value)
                  }} value={target}>
                    <option value="0.3">30%</option>
                    <option value="0.4">40%</option>
                    <option value="0.5">50%</option>
                    <option value="0.6">60%</option>
                    <option value="0.7">70%</option>
                    <option value="0.8">80%</option>
                    <option value="0.9">90% (max)</option>
                  </select>
                </form>
              </span>
              <br></br>
              <h3>Analyser Versions</h3>
              <AnalyserVersionList
                analyser_id={analyser_id}
                analyser_version={analyser_version}
                analyser_versions={analyser_versions}
                accuracy_target={target}
                onVersionChange={onVersionChange}
              />
            </>
            ) : (<></>)}
          </div>);
          
        
}
  
export default ReviewAnalyser