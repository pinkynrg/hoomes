import { Button, Form, InputNumber } from 'antd'
import style from './Dropdowns.module.scss'
import { NumberFormatter, stringToNumber } from '../../../utils'

interface PriceFilterDropdownProps {
  minPrice?: string,
  maxPrice?: string
  onSubmit: (data: {minPrice: string, maxPrice: string}) => void
}

const PriceFilterDropdown = ({
  minPrice,
  maxPrice,
  onSubmit,
}: PriceFilterDropdownProps) => (
  <Form
    layout="horizontal"
    onFinish={onSubmit}
    className={style.Dropdown}
    initialValues={{
      minPrice,
      maxPrice,
    }}
  >
    <Form.Item name="minPrice">
      <InputNumber
        className={style.InputNumber}
        addonAfter="€"
        style={{ width: '100%' }}
        controls={false}
        placeholder="Min. Price"
        formatter={(value) => (value ? NumberFormatter.format(value) : '')}
        parser={(value?: string) => (value ? stringToNumber(value) : '')}
      />
    </Form.Item>
    <Form.Item name="maxPrice">
      <InputNumber
        className={style.InputNumber}
        addonAfter="€"
        style={{ width: '100%' }}
        controls={false}
        placeholder="Max. Price"
        formatter={(value) => (value ? NumberFormatter.format(value) : '')}
        parser={(value?: string) => (value ? stringToNumber(value) : '')}
      />
    </Form.Item>
    <Button htmlType="submit">
      Vedi Annunci
    </Button>
  </Form>
)

export { PriceFilterDropdown }
