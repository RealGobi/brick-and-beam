import React from 'react'
import Toast from '../../componants/MUI/Toast/Toast'

interface Props { }

function Dashboard(props: Props) {
    const { } = props
    const [open, setOpen] = React.useState(false);

    return (
        <div>
            <h1>Dashboard</h1>
            <Toast open={open} setOpen={setOpen} message={'A random message'} />
            <button onClick={() => {
                setOpen(true);
            }}>Click me!</button>
        </div>
    )
}

export default Dashboard
