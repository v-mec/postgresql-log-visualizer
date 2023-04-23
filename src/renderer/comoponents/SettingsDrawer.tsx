import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  FormControl,
  FormLabel,
  HStack,
  Text,
  Checkbox,
  VStack,
  Select,
} from '@chakra-ui/react';
import { useSettings } from '../contexts';

interface SettingsDrawerProps {
  isOpen: boolean;
  isTransactionViewDisabled: boolean;
  onClose: () => void;
}

function SettingsDrawer(props: SettingsDrawerProps) {
  const { isOpen, onClose, isTransactionViewDisabled } = props;
  const { settings, updateSettings } = useSettings();

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Graph settings</DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="start">
            <FormControl>
              <FormLabel>Label font size</FormLabel>
              <HStack spacing={4}>
                <Slider
                  min={0}
                  max={10}
                  value={settings.fontSize}
                  onChange={(value) =>
                    updateSettings({ ...settings, fontSize: value })
                  }
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Text>{settings.fontSize}</Text>
              </HStack>
            </FormControl>
            <FormControl>
              <FormLabel>Layout algorithm</FormLabel>
              <Select
                value={settings.layout}
                onChange={(event) =>
                  updateSettings({ ...settings, layout: event.target.value })
                }
              >
                <option value="cose">CoSE</option>
                <option value="fcose">fCoSE</option>
              </Select>
            </FormControl>
            <Checkbox
              isDisabled={isTransactionViewDisabled}
              isChecked={settings.isTransactionView}
              onChange={(event) =>
                updateSettings({
                  ...settings,
                  isTransactionView: event.target.checked,
                })
              }
            >
              Transaction view
            </Checkbox>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

export default SettingsDrawer;
