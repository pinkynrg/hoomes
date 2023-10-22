const fs = require('fs');
const path = require('path');

const componentName = process.argv[2];

if (!componentName) {
  console.error('Please provide a component name.');
  process.exit(1);
}

const componentDirectory = path.join(__dirname, '..', 'src', 'components', componentName);

// Check if the component directory already exists
if (fs.existsSync(componentDirectory)) {
  console.error(`Component '${componentName}' already exists.`);
  process.exit(1);
}

// Create the component directory
fs.mkdirSync(componentDirectory);

// Create MyComponent.module.scss file
const scssContent = `.Container {
  border: 1px solid black;
}`;
fs.writeFileSync(path.join(componentDirectory, `${componentName}.module.scss`), scssContent);

// Create MyComponent.tsx file
const tsxContent = `import style from './${componentName}.module.scss';
import classnames from 'classnames';

interface ${componentName}Props {
  className?: string
}

const ${componentName} = ({
  className,
}: ${componentName}Props) => (
  <div className={classnames(style.Container, className)}>
    {/* Your component content here */}
  </div>
);

export { ${componentName} };
`;
fs.writeFileSync(path.join(componentDirectory, `${componentName}.tsx`), tsxContent);

console.log(`Component '${componentName}' created successfully.`);