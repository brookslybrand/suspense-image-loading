import React, {
  Suspense,
  SuspenseList,
  createContext,
  useState,
  useContext
} from 'react'

import ErrorBoundary from './ErrorBoundary'

// just some stuff we know
const N_PICTURES = 20
const N_PICTURES_PER_ROW = 5

// image component types
const REGULAR = 'REGULAR'
const SUSPENSE = 'SUSPENSE'
const SUSPENSE_LIST = 'SUSPENSE_LIST'
const MULTIPLE_SUSPENSE_LIST = 'MULTIPLE_SUSPENSE_LIST'

const RevealOrderContext = createContext()

const RevealOrderSelect = ({ label, value, onChange }) => (
  <label>
    {label}
    <br />
    <select value={value} onChange={onChange}>
      <option value={'forwards'}>forward</option>
      <option value={'together'}>together</option>
      <option value={'backwards'}>backwards</option>
    </select>
  </label>
)

function App() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [imageComponent, setImageComponent] = useState(REGULAR)
  const [errorRate, setErrorRate] = useState(0)
  const [revealOrderOuter, setRevealOrderOuter] = useState('forwards')
  const [revealOrderInner, setRevealOrderInner] = useState('forwards')

  const handleRefresh = () => setRefreshKey(prevKey => prevKey + 1)

  return (
    <>
      <div className="controls">
        <button onClick={handleRefresh}>Reload images</button>
        <br />
        <label>
          Image loading method:
          <br />
          <select
            value={imageComponent}
            onChange={e => setImageComponent(e.target.value)}
          >
            <option value={REGULAR}>Regular {`<img />`}</option>
            <option value={SUSPENSE}>with Suspense</option>
            <option value={SUSPENSE_LIST}>with Suspense List</option>
            <option value={MULTIPLE_SUSPENSE_LIST}>
              with Multiple Suspense Lists
            </option>
          </select>
        </label>
        <br />
        <label htmlFor="error-rate">Error Rate</label>
        <input
          id="error-rate"
          value={errorRate}
          onChange={e => setErrorRate(Math.min(Math.max(0, e.target.value), 1))}
          type="number"
          min={0}
          max={1}
          step={0.01}
        />
        <br />
        {(imageComponent === SUSPENSE_LIST ||
          imageComponent === MULTIPLE_SUSPENSE_LIST) && (
          <>
            <RevealOrderSelect
              label={`Reveal order${
                imageComponent === MULTIPLE_SUSPENSE_LIST ? ' outer' : ''
              }:`}
              value={revealOrderOuter}
              onChange={e => setRevealOrderOuter(e.target.value)}
            />
            <br />
          </>
        )}
        {imageComponent === MULTIPLE_SUSPENSE_LIST && (
          <>
            <RevealOrderSelect
              label={`Reveal order inner`}
              value={revealOrderInner}
              onChange={e => setRevealOrderInner(e.target.value)}
            />
            <br />
          </>
        )}
      </div>
      <div key={refreshKey} className="App">
        <RevealOrderContext.Provider
          value={{ revealOrderOuter, revealOrderInner }}
        >
          <Images imageComponent={imageComponent} errorRate={errorRate} />
        </RevealOrderContext.Provider>
      </div>
    </>
  )
}

const Images = ({ imageComponent, errorRate }) => {
  switch (imageComponent) {
    case REGULAR:
      return <RegularImages errorRate={errorRate} />
    case SUSPENSE:
      return <ImagesWithSuspense errorRate={errorRate} />
    case SUSPENSE_LIST:
      return <ImagesWithSuspenseList errorRate={errorRate} />
    case MULTIPLE_SUSPENSE_LIST:
      return <ImagesWithMultipleSuspenseLists errorRate={errorRate} />
    default:
      throw new Error('invalid image component type')
  }
}

const RegularImages = ({ errorRate }) =>
  Array.from({ length: N_PICTURES }).map((_, id) => (
    <img
      className=""
      key={id}
      src={randomReject(
        () => `images/${id}.jpeg?${performance.now()}`,
        () => '',
        errorRate
      )}
      alt={`dog ${id}`}
    />
  ))

const ImagesWithSuspense = ({ errorRate }) => {
  return Array.from({ length: N_PICTURES }).map((_, id) => (
    <Suspense key={id} fallback={<div className="image-placeholder" />}>
      <ErrorBoundary>
        <SuspenseImage
          imageResource={fetchImageData(id, errorRate)}
          alt={`dog ${id}`}
        />
      </ErrorBoundary>
    </Suspense>
  ))
}

const ImagesWithSuspenseList = ({ errorRate }) => {
  const { revealOrderOuter } = useContext(RevealOrderContext)
  return (
    <SuspenseList revealOrder={revealOrderOuter}>
      {Array.from({ length: N_PICTURES }).map((_, id) => (
        <Suspense key={id} fallback={<div className="image-placeholder" />}>
          <ErrorBoundary>
            <SuspenseImage
              imageResource={fetchImageData(id, errorRate)}
              alt={`dog ${id}`}
            />
          </ErrorBoundary>
        </Suspense>
      ))}
    </SuspenseList>
  )
}

const ImagesWithMultipleSuspenseLists = ({ errorRate }) => {
  const { revealOrderOuter, revealOrderInner } = useContext(RevealOrderContext)

  return (
    <SuspenseList revealOrder={revealOrderOuter}>
      {idsPerRow.map((row, idx) => (
        <SuspenseList key={idx} revealOrder={revealOrderInner}>
          {row.map(id => (
            <Suspense key={id} fallback={<div className="image-placeholder" />}>
              <ErrorBoundary>
                <SuspenseImage
                  imageResource={fetchImageData(id, errorRate)}
                  alt={`dog ${id}`}
                />
              </ErrorBoundary>
            </Suspense>
          ))}
        </SuspenseList>
      ))}
    </SuspenseList>
  )
}

const SuspenseImage = ({ imageResource, alt }) => {
  return <img className="suspense-image" src={imageResource.read()} alt={alt} />
}

// given an id, return the image's path
// if cache=false, it will add `performance.now` to the image path
const getImageSrc = (id, cache = false) => {
  const root = `images/${id}.jpeg`
  return cache ? root : `${root}?${performance.now()}`
}

// an array of arrays used to group the images together
const idsPerRow = Array.from({ length: N_PICTURES }).reduce((acc, _, i) => {
  const arrayIndex = Math.floor(i / N_PICTURES_PER_ROW)
  if (acc[arrayIndex] === undefined) acc[arrayIndex] = [i]
  else acc[arrayIndex].push(i)
  return acc
}, [])

// wrap our image getter with a promise
const fetchImageData = (id, errorRate) => {
  const src = getImageSrc(id)
  return wrapPromise(getImage(src, errorRate))
}

function getImage(src, errorRate) {
  const img = new Image()
  img.src = src
  return new Promise((resolve, reject) => {
    img.addEventListener('load', () => {
      const imgCanvas = document.createElement('canvas')
      imgCanvas.width = img.width
      imgCanvas.height = img.height
      imgCanvas.getContext('2d').drawImage(img, 0, 0)
      const dataURL = imgCanvas.toDataURL('image/jpeg')
      randomReject(
        () => resolve(dataURL),
        () => reject('The image failed to load'),
        errorRate
      )
    })
  })
}

// rejects with errorRate% chance
const randomReject = (resolve, reject, errorRate = 0) => {
  if (Math.random() < errorRate) return reject()
  else return resolve()
}

// don't actually use this in production, taken from the React docs:
// https://reactjs.org/docs/concurrent-mode-suspense.html
function wrapPromise(promise) {
  let status = 'pending'
  let result
  let suspender = promise.then(
    r => {
      status = 'success'
      result = r
    },
    e => {
      status = 'error'
      result = e
    }
  )
  return {
    read() {
      if (status === 'pending') {
        throw suspender
      } else if (status === 'error') {
        throw new Error('image could not be loaded')
      } else if (status === 'success') {
        return result
      }
    }
  }
}

export default App
