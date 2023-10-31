import { Button, Form, InputNumber } from 'antd'
import style from './Dropdowns.module.scss'
import { NumberFormatter, stringToNumber } from '../../../utils'

interface SizeFilterDropdownProps {
  minSize?: string,
  maxSize?: string
  onSubmit: (data: {minSize: string, maxSize: string}) => void
}

const SizeFilterDropdown = ({
  minSize,
  maxSize,
  onSubmit,
}: SizeFilterDropdownProps) => (
  <Form
    layout="horizontal"
    onFinish={onSubmit}
    className={style.Dropdown}
    initialValues={{
      minSize,
      maxSize,
    }}
  >
    <Form.Item name="minSize">
      <InputNumber
        className={style.InputNumber}
        addonAfter="m&sup2;"
        style={{ width: '100%' }}
        controls={false}
        placeholder="Min. Size"
        formatter={(value) => (value ? NumberFormatter.format(value) : '')}
        parser={(value?: string) => (value ? stringToNumber(value) : '')}
      />
    </Form.Item>
    <Form.Item name="maxSize">
      <InputNumber
        className={style.InputNumber}
        addonAfter="m&sup2;"
        style={{ width: '100%' }}
        controls={false}
        placeholder="Max. Size"
        formatter={(value) => (value ? NumberFormatter.format(value) : '')}
        parser={(value?: string) => (value ? stringToNumber(value) : '')}
      />
    </Form.Item>
    <Button htmlType="submit">
      Vedi Annunci
    </Button>
  </Form>
)

export { SizeFilterDropdown }
