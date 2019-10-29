import React, { Suspense, SuspenseList, useState } from 'react'

import ErrorBoundary from './ErrorBoundary'

// just some stuff we know
const N_PICTURES = 20
const N_PICTURES_PER_ROW = 5

function App() {
  const [showImages, setShowImages] = useState(true)
  return (
    <>
      <button onClick={() => setShowImages(show => !show)}>
        {showImages ? 'hide' : 'show'} images
      </button>
      <div className="App">
        <ImagesWithMultipleSuspenseLists showImages={showImages} />
      </div>
    </>
  )
}

const RegularImages = ({ showImages }) =>
  showImages &&
  Array.from({ length: N_PICTURES }).map((_, id) => (
    <img
      className=""
      key={id}
      src={randomReject(() => `images/${id}.jpeg`, () => '')}
      alt={`dog ${id}`}
    />
  ))

const ImagesWithSuspense = ({ showImages }) =>
  showImages &&
  Array.from({ length: N_PICTURES }).map((_, id) => (
    <Suspense key={id} fallback={<div className="image-placeholder" />}>
      <ErrorBoundary>
        <SuspenseImage
          imageResource={fetchImageData(`images/${id}.jpeg`)}
          alt={`dog ${id}`}
        />
      </ErrorBoundary>
    </Suspense>
  ))

const ImagesWithSuspenseList = ({ showImages }) => (
  <SuspenseList revealOrder="forwards">
    {showImages &&
      Array.from({ length: N_PICTURES }).map((_, id) => (
        <Suspense key={id} fallback={<div className="image-placeholder" />}>
          <ErrorBoundary>
            <SuspenseImage
              imageResource={fetchImageData(`images/${id}.jpeg`)}
              alt={`dog ${id}`}
            />
          </ErrorBoundary>
        </Suspense>
      ))}
  </SuspenseList>
)

const ImagesWithMultipleSuspenseLists = ({ showImages }) => (
  <SuspenseList revealOrder="forwards">
    {showImages &&
      idsPerRow.map((row, idx) => (
        <SuspenseList key={idx} revealOrder="together">
          {row.map(id => (
            <Suspense key={id} fallback={<div className="image-placeholder" />}>
              <ErrorBoundary>
                <SuspenseImage
                  imageResource={fetchImageData(`images/${id}.jpeg`)}
                  alt={`dog ${id}`}
                />
              </ErrorBoundary>
            </Suspense>
          ))}
        </SuspenseList>
      ))}
  </SuspenseList>
)

// an array of arrays used to group the images together
const idsPerRow = Array.from({ length: N_PICTURES }).reduce((acc, _, i) => {
  const arrayIndex = Math.floor(i / N_PICTURES_PER_ROW)
  if (acc[arrayIndex] === undefined) acc[arrayIndex] = [i]
  else acc[arrayIndex].push(i)
  return acc
}, [])

const SuspenseImage = ({ imageResource, alt }) => (
  <img className="suspense-image" src={imageResource.read()} alt={alt} />
)

// rejects with perc% chance
const randomReject = (resolve, reject, perc = 0.3) => {
  if (Math.random() < perc) return reject()
  else return resolve()
}

function getImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    img.addEventListener('load', () => {
      const imgCanvas = document.createElement('canvas')
      imgCanvas.width = img.width
      imgCanvas.height = img.height
      imgCanvas.getContext('2d').drawImage(img, 0, 0)
      const dataURL = imgCanvas.toDataURL('image/jpeg')
      // resolve(dataURL)
      setTimeout(
        () =>
          randomReject(
            () => resolve(dataURL),
            () => reject('The image failed to load')
          ),
        Math.random() * 1000
      )
    })
  })
}

// wrap our image getter with a promise
const fetchImageData = src => wrapPromise(getImage(src))

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
