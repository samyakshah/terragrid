import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuantityStepper } from '@/components/ConfigPanel/QuantityStepper'

describe('QuantityStepper', () => {
  it('commits valid whole-number input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<QuantityStepper value={1} maxAllowed={10} onChange={onChange} />)

    const input = screen.getByLabelText('Device quantity')

    await user.clear(input)
    await user.type(input, '4')

    expect(onChange).toHaveBeenLastCalledWith(4)
  })

  it('does not commit invalid over-limit input and shows an error after blur', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<QuantityStepper value={1} maxAllowed={5} onChange={onChange} />)

    const input = screen.getByLabelText('Device quantity')

    await user.clear(input)
    await user.type(input, '6')
    await user.tab()

    expect(onChange).not.toHaveBeenCalledWith(6)
    expect(screen.getByText('Only 5 remaining.')).toBeTruthy()
  })

  it('shows an error for decimal input and normalizes it to a whole number on blur', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<QuantityStepper value={0} maxAllowed={10} onChange={onChange} />)

    const input = screen.getByLabelText('Device quantity')

    await user.clear(input)
    await user.type(input, '3.8')
    await user.tab()

    expect(screen.getByText('Use a whole number.')).toBeTruthy()
    expect(onChange).toHaveBeenLastCalledWith(3)
  })
})
