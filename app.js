import { ARButton } from './ARButton.js';

/**
 * Canvas
 */
const canvas = document.querySelector('.webgl')

/**
 * Scene
 */
const scene = new THREE.Scene()

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
    70, window.innerWidth / window.innerHeight, 0.01, 20
)

/**
 * Lights
 */
const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)
light.position.set(0.5, 1, 0.25)
scene.add(light)

/**
 * Renderer
 */
const renderer = new THREE.WebGL1Renderer({ antialias: true, alpha: true })
renderer.setPixelRatio( window.devicePixelRatio )
renderer.setSize( window.innerWidth, window.innerHeight )
renderer.xr.enabled = true
canvas.append( renderer.domElement )

/**
 * Set WebXR
 */
document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ]} ))


// Reticle
let reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX( -Math.PI / 2),
    new THREE.MeshBasicMaterial()
)
reticle.matrixAutoUpdate = false
reticle.visible = false
scene.add(reticle)

// AR Contents
const geo = new THREE.CylinderGeometry( 0.1, 0.1, 0.2, 32 ).translate( 0, 0.1, 0)

const onSelect = () =>
{
    if(reticle.visible)
    {
        const mat = new THREE.MeshPhongMaterial({ color: 0xffffff * Math.random() })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.setFromMatrixPosition( reticle.matrix )
        mesh.scale.y = Math.random() * 2 + 1
        scene.add(mesh)
    }
}

// Controller
let controller = renderer.xr.getController(0)
controller.addEventListener('select', onSelect)
scene.add(controller)

window.addEventListener('resize', () =>
{
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
})

// RenderLoop
const animate = () =>
{
    renderer.setAnimationLoop(render)
}

// Hit-Test Setting
let hitTestSource = null
let hitTestSourceRequested = false

const render = (timestamp, frame) =>
{
    if(frame)
    {
        // 기기를 통한 움직이는 공간
        const referenceSpace = renderer.xr.getReferenceSpace()
        const session = renderer.xr.getSession()

        if(hitTestSourceRequested === false)
        {
            session.requestReferenceSpace('viewer').then((referenceSpace) =>
            {
                session.requestHitTestSource({ space: referenceSpace }).then((source) =>
                {
                    hitTestSource = source
                })
            })

            session.addEventListener('end', () =>
            {
                hitTestSourceRequested = false
                hitTestSource = null
            })

            hitTestSourceRequested = true
        }

        if(hitTestSource)
        {
            const hitTestResults = frame.getHitTestResults(hitTestSource)

            if(hitTestResults.length)
            {
                const hit = hitTestResults[0]

                reticle.visible = true
                reticle.matrix.fromArray( hit.getPose(referenceSpace).transform.matrix )
            }
            else
            {
                reticle.visible = false
            }
        }
    }

    renderer.render(scene, camera)
}

animate()