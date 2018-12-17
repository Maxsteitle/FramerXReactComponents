import * as React from 'react'
import { PropertyControls, ControlType, animate } from 'framer'
import styled, { css } from 'styled-components'

const NewButton = styled.div`
    display: ${props => (props.fullWidth ? 'block' : 'inline-block')};
    line-height: 16px;
    transition: 0.1s;
    align-items: center;
    justify-content: center;
    text-align: center;

    ${props =>
			props.buttonSize == 'S' &&
			css`
				border-radius: 4px;
				padding: 4px 8px;
				font-size: 12px;
			`}

    ${props =>
			props.buttonSize == 'M' &&
			css`
				border-radius: 8px;
				padding: 8px 16px;
				font-size: 14px;
			`}

    ${props =>
			props.buttonSize == 'L' &&
			css`
				border-radius: 12px;
				padding: 12px 24px;
				font-size: 16px;
			`}

    ${props =>
			props.buttonType == 'Primary' &&
			css`
				background: #006dff;
				color: #ffffff;

				&:hover {
					cursor: pointer;
					background: #2986ff;
				}

				&:active:hover {
					background: #005bd1;
				}
			`}

    ${props =>
			props.buttonType == 'Secondary' &&
			css`
				color: #000000;
				background: #ffffff;
				box-shadow: inset 0px 0px 0px 1px rgba(0, 0, 0, 0.2);

				&:hover {
					cursor: pointer;
					box-shadow: inset 0px 0px 0px 1px rgba(0, 109, 255, 1),
						0px 0px 0px 6px rgba(0, 109, 255, 0);
					color: #006dff;
					transition: 0.3s;
				}

				&:active {
					box-shadow: inset 0px 0px 0px 1px rgba(0, 109, 255, 1),
						0px 0px 0px 0px rgba(0, 109, 255, 0.3);
					transition: 0s;
				}
			`}`

// Define type of property
interface Props {
	text: string
	height: string
	width: string
	buttonType: string
	fullWidth: boolean
	buttonSize: string
}

export class Button2 extends React.Component<Props> {
	state = { count: 0 }

	increment = () => this.setState({ count: this.state.count + 1 })

	static defaultProps = {
		text: 'Button',
		height: 32,
		width: 72,
		buttonType: 'Primary',
		fullWidth: false,
		buttonSize: 'M'
	}

	// Items shown in property panel
	static propertyControls: PropertyControls = {
		text: { type: ControlType.String, title: 'Text' },
		buttonType: {
			type: ControlType.Enum,
			options: ['Primary', 'Secondary'],
			title: 'Button'
		},
		fullWidth: {
			type: ControlType.Boolean,
			title: 'Full Width'
		},
		buttonSize: {
			type: ControlType.SegmentedEnum,
			title: 'Size',
			options: ['S', 'M', 'L']
		}
	}

	render() {
		return (
			<NewButton
				buttonType={this.props.buttonType}
				buttonSize={this.props.buttonSize}
				fullWidth={this.props.fullWidth}
				onClick={this.increment}
			>
				{this.props.text}
				{this.state.count}
			</NewButton>
		)
	}
}
